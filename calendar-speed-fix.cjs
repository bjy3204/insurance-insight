const fs=require('fs'),vm=require('vm');let s=fs.readFileSync('Code-CRM-calendar-two-columns.txt','utf8');
s=s.replace("sheet.getRange('B2').clearDataValidations().setValue('캘린더');","sheet.getRange('B2').clearDataValidations().clearContent();");
s=s.replace(/^  sheet\.showColumns\(2,21\);[^\r\n]+\r?\n/m,'').replace(/^  sheet\.setColumnWidths\(2,14,65\);[^\r\n]+\r?\n/m,'').replace(/^  sheet\.getRange\('Q2:V2'\)[^\r\n]+\r?\n/m,'');
s=s.replace(/  sheet\.getRange\('B4:O4'\)\.breakApart\(\);\r?\n  \['일'[^\r\n]+\r?\n/,"  sheet.getRange('B4:O4').setValues([['일','','월','','화','','수','','목','','금','','토','']]);\n");
s=s.replace("sheet.getRange('B5:O34').breakApart().setNumberFormat('@').setValues(values).setFontColors(colors).setFontWeight('normal');", "sheet.getRange('B5:O34').setValues(values).setFontColors(colors);\n  const formats=Array.from({length:30},(_,r)=>Array.from({length:14},(_,c)=>r%5===0&&c%2===0?'0':'@'));\n  sheet.getRange('B5:O34').setNumberFormats(formats);");
const a=s.indexOf('  for(let week=0;week<6;week++){',s.indexOf("sheet.getRange('B5:O34').setValues")),b=s.indexOf('  PropertiesService.getDocumentProperties()',a);if(a<0||b<0)throw Error('format block missing');s=s.slice(0,a)+s.slice(b);
new vm.Script(s);fs.writeFileSync('Code-CRM-calendar-fast.txt',s);console.log('PASS: full script syntax; repeated merges and width changes removed');
