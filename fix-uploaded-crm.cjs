const fs=require('fs'),vm=require('vm');
const source='C:/Users/bjy32/.codex/attachments/90fbe587-440a-43cf-9400-f88a91eaf7bc/붙여넣은 텍스트.txt';
let s=fs.readFileSync(source,'utf8');
const old="sheet.getRange('B5:H36').breakApart().clearContent().clearNote().setBackground('#ffffff').setFontColor('#202124').setBorder(false,false,false,false,false,false);";
if(!s.includes(old))throw Error('Expected original calendar cleanup missing');
s=s.replace(old,"// 예전 3행 달력의 유효성 검사만 제거합니다. 달력 틀과 테두리는 유지합니다.\n  sheet.getRange('B5:H36').clearDataValidations().clearNote();");
s=s.replace("    sheet.getRange(row,2,5,7).setBorder(true,true,true,true,true,false,'#b7b7b7',SpreadsheetApp.BorderStyle.SOLID);\n",'');
s=s.replace("  sheet.setRowHeights(6,31,28);\n",'');
s=s.replace("    form.getRange(item[2]).setNote(note);\n    form.getRange(item[3]).setNote(note);", "    const right=item[0]==='고객 등록'?item[3]:item[2];\n    const left=item[0]==='고객 등록'?item[2]:item[3];\n    form.getRange(left).clearNote();form.getRange(right).setNote(note);");
// normalize source CRLF before applying the note change too
s=s.replace(/    form\.getRange\(item\[2\]\)\.setNote\(note\);\r?\n    form\.getRange\(item\[3\]\)\.setNote\(note\);/,"    const right=item[0]==='고객 등록'?item[3]:item[2];\n    const left=item[0]==='고객 등록'?item[2]:item[3];\n    form.getRange(left).clearNote();form.getRange(right).setNote(note);");
new vm.Script(s);fs.writeFileSync('Code-CRM-calendar-validation-fixed.txt',s);
const start=s.indexOf('const CRM_CALENDAR_VIEWS'),end=s.indexOf('// 한국천문연구원',start);fs.writeFileSync('crm-calendar.gs',s.slice(start,end));
console.log('PASS: full script syntax; based on actual uploaded Code.gs');
