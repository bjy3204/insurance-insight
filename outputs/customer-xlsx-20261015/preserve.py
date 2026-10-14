"""Merge authored cells back into the original package to preserve native Excel extensions.
Artifact Tool does not roundtrip the source's x14 data-validation/formatting extensions.
This bridge carries only the generated, edited cells/styles into the original workbook.
"""
from pathlib import Path
from copy import deepcopy
import json, zipfile, xml.etree.ElementTree as E

folder=Path(__file__).parent
S='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
NS={'s':S}
def tag(name): return '{'+S+'}'+name
def xml(root): return E.tostring(root,encoding='utf-8',xml_declaration=True)
with zipfile.ZipFile(folder/'source.xlsx') as original, zipfile.ZipFile(folder/'customer-no-macro.xlsx') as edited:
    source_styles=E.fromstring(original.read('xl/styles.xml'))
    edit_styles=E.fromstring(edited.read('xl/styles.xml'))
    offsets={}
    for name in ('fonts','fills','borders','cellStyleXfs'):
        before=source_styles.find('s:'+name,NS);after=edit_styles.find('s:'+name,NS)
        offsets[name]=len(before)
        for child in after: before.append(deepcopy(child))
        before.attrib['count']=str(len(before))
    formats=source_styles.find('s:numFmts',NS)
    if formats is None:
        formats=E.Element(tag('numFmts'),{'count':'0'});source_styles.insert(0,formats)
    format_codes={node.attrib['formatCode']:int(node.attrib['numFmtId']) for node in formats}
    next_format=max([163]+list(format_codes.values()))+1
    numfmt={}
    for node in edit_styles.findall('s:numFmts/s:numFmt',NS):
        code=node.attrib['formatCode'];old_id=int(node.attrib['numFmtId'])
        if code not in format_codes:
            new=deepcopy(node);new.attrib['numFmtId']=str(next_format);formats.append(new);format_codes[code]=next_format;next_format+=1
        numfmt[old_id]=format_codes[code]
    formats.attrib['count']=str(len(formats))
    # Rebase imported styles; all original style indexes remain untouched.
    def rebase(xf):
        for attribute,collection in [('fontId','fonts'),('fillId','fills'),('borderId','borders'),('xfId','cellStyleXfs')]:
            if attribute in xf.attrib: xf.attrib[attribute]=str(int(xf.attrib[attribute])+offsets[collection])
        old=int(xf.attrib.get('numFmtId','0'))
        if old in numfmt: xf.attrib['numFmtId']=str(numfmt[old])
    for xf in list(source_styles.find('s:cellStyleXfs',NS))[offsets['cellStyleXfs']:]: rebase(xf)
    xfs=source_styles.find('s:cellXfs',NS);style_offset=len(xfs)
    for xf in edit_styles.find('s:cellXfs',NS):
        new=deepcopy(xf);rebase(new);xfs.append(new)
    xfs.attrib['count']=str(len(xfs))
    strings=[]
    if 'xl/sharedStrings.xml' in edited.namelist():
        strings=E.fromstring(edited.read('xl/sharedStrings.xml')).findall('s:si',NS)
    def copy_cell(cell):
        new=deepcopy(cell)
        if 's' in new.attrib:new.attrib['s']=str(int(new.attrib['s'])+style_offset)
        if new.attrib.get('t')=='s':
            v=new.find('s:v',NS);si=strings[int(v.text)];new.remove(v);new.attrib['t']='inlineStr'
            inline=E.SubElement(new,tag('is'))
            for child in si:inline.append(deepcopy(child))
        return new
    changes=json.loads((folder/'changed.json').read_text(encoding='utf-8'))
    def hide_columns(cols,start,end):
        for column in list(cols):
            left,right=int(column.attrib['min']),int(column.attrib['max'])
            if right<start or left>end:continue
            cols.remove(column)
            if left<start:
                split=deepcopy(column);split.attrib['max']=str(start-1);cols.append(split)
            if right>end:
                split=deepcopy(column);split.attrib['min']=str(end+1);cols.append(split)
        E.SubElement(cols,tag('col'),{'min':str(start),'max':str(end),'width':'12','customWidth':'1','hidden':'1'})
        cols[:]=sorted(cols,key=lambda column:int(column.attrib['min']))
    names={'고객추가':4,'고객관리 LIST':5,'고객정보 조회(이름+생년월일)':6,'고객정보 조회':7}
    replacements={'xl/styles.xml':xml(source_styles)}
    for name,number in names.items():
        path=f'xl/worksheets/sheet{number}.xml'
        root=E.fromstring(original.read(path));modified=E.fromstring(edited.read(path))
        wanted={cell for sheet,cell in changes if sheet==name}
        if number==4:wanted.update(c.attrib['r'] for c in modified.findall('.//s:sheetData/s:row/s:c',NS))
        if number==5:
            wanted.update(f'{column}{row}' for row in range(6,1000) for column in ('A','D','E','AC','AD'))
        data=root.find('s:sheetData',NS)
        rows={int(r.attrib['r']):r for r in data}
        for edited_row in modified.findall('s:sheetData/s:row',NS):
            row_number=int(edited_row.attrib['r'])
            for cell in edited_row.findall('s:c',NS):
                address=cell.attrib['r']
                if address not in wanted:continue
                row=rows.get(row_number)
                if row is None:row=E.SubElement(data,tag('row'),{'r':str(row_number)});rows[row_number]=row
                for old in list(row):
                    if old.attrib.get('r')==address:row.remove(old)
                row.append(copy_cell(cell))
            if number==4 or row_number==18:
                if row_number in rows:
                    for attribute in ('ht','customHeight'):
                        if attribute in edited_row.attrib:rows[row_number].attrib[attribute]=edited_row.attrib[attribute]
        if number==4:
            for row in list(data):
                for c in list(row):
                    if c.attrib.get('r')=='AH1':row.remove(c)
        def column_number(address):
            letters=''.join(c for c in address if c.isalpha());result=0
            for letter in letters:result=result*26+ord(letter)-64
            return result
        for row in data:
            row[:]=sorted(row,key=lambda c:column_number(c.attrib['r']))
        data[:]=sorted(data,key=lambda row:int(row.attrib['r']))
        # Keep original pictures, relationships, conditional formats and extension lists.
        for element_name in ('mergeCells','dataValidations'):
            new=modified.find('s:'+element_name,NS)
            old=root.find('s:'+element_name,NS)
            if old is not None:root.remove(old)
            if new is not None:
                new=deepcopy(new)
                if element_name=='dataValidations':
                    for validation in new:
                        validation.attrib.update({'showErrorMessage':'1','errorStyle':'stop','errorTitle':'입력 확인','error':'생년월일은 숫자 6자리로 입력하세요.'})
                # These elements precede printing and drawings in the worksheet schema.
                later={'printOptions','pageMargins','pageSetup','headerFooter','drawing','legacyDrawing','extLst'}
                index=next((i for i,child in enumerate(root) if child.tag.split('}')[-1]in later),len(root))
                root.insert(index,new)
        if number==5:
            cols=root.find('s:cols',NS)
            if cols is None:cols=E.Element(tag('cols'));root.insert(list(root).index(data),cols)
            hide_columns(cols,29,30)
            # Carry the newly authored Excel table without replacing native drawing relationships.
            edited_rel=E.fromstring(edited.read('xl/worksheets/_rels/sheet5.xml.rels'))
            table_rel=next(item for item in edited_rel if item.attrib['Type'].endswith('/table'))
            edited_table='xl/'+table_rel.attrib['Target'].replace('../','').lstrip('/')
            if edited_table not in edited.namelist():
                edited_table=table_rel.attrib['Target'].lstrip('/')
            replacements['xl/tables/customer-input.xml']=edited.read(edited_table)
            rel_path='xl/worksheets/_rels/sheet5.xml.rels'
            relation_ns='http://schemas.openxmlformats.org/package/2006/relationships'
            relationships=E.fromstring(original.read(rel_path)) if rel_path in original.namelist() else E.Element('{'+relation_ns+'}Relationships')
            E.SubElement(relationships,'{'+relation_ns+'}Relationship',{'Id':'rIdCustomerTable','Type':table_rel.attrib['Type'],'Target':'../tables/customer-input.xml'})
            replacements[rel_path]=xml(relationships)
            parts=E.Element(tag('tableParts'),{'count':'1'})
            E.SubElement(parts,tag('tablePart'),{'{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id':'rIdCustomerTable'})
            ext=root.find('s:extLst',NS)
            root.insert(list(root).index(ext) if ext is not None else len(root),parts)
        if number in (6,7):
            cols=root.find('s:cols',NS)
            if cols is None:cols=E.Element(tag('cols'));root.insert(list(root).index(data),cols)
            hide_columns(cols,32,37)
        replacements[path]=xml(root)
    book=E.fromstring(original.read('xl/workbook.xml'))
    calc=book.find('s:calcPr',NS)
    if calc is None:calc=E.SubElement(book,tag('calcPr'))
    calc.attrib.update({'calcMode':'auto','fullCalcOnLoad':'1','forceFullCalc':'1'})
    view=book.find('s:bookViews/s:workbookView',NS)
    if view is not None:view.attrib['activeTab']='3'
    replacements['xl/workbook.xml']=xml(book)
    content_types=E.fromstring(original.read('[Content_Types].xml'))
    E.SubElement(content_types,'{http://schemas.openxmlformats.org/package/2006/content-types}Override',{'PartName':'/xl/tables/customer-input.xml','ContentType':'application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml'})
    replacements['[Content_Types].xml']=xml(content_types)
    target=folder/'고객관리노트_매크로없는수정본.xlsx'
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED)as out:
        for item in original.infolist():out.writestr(deepcopy(item),replacements.get(item.filename,original.read(item.filename)))
        for path,content in replacements.items():
            if path not in original.namelist():out.writestr(path,content)
    with zipfile.ZipFile(target)as check:
        untouched=[item.filename for item in original.infolist()if item.filename not in replacements]
        assert all(check.read(path)==original.read(path)for path in untouched)
        assert not any('vbaProject'in path for path in check.namelist())
        print('Preserved native parts:',len(untouched),'Edited parts:',len(replacements),'Macro-free output:',target)
