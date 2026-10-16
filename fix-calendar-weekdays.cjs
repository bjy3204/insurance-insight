const fs=require('fs'),vm=require('vm');let s=fs.readFileSync('Code-CRM-calendar-approved.txt','utf8');
s=s.replace(/^\s*sheet\.getRange\('G4:H5'\)\.clearContent\(\)\.clearDataValidations\(\);\r?\n/m,'');
s=s.replace("  const colors=Array.from({length:30}","  sheet.getRange('B4:O4').setValues([['일','','월','','화','','수','','목','','금','','토','']]);\n  const colors=Array.from({length:30}");
new vm.Script(s);fs.writeFileSync('Code-CRM-calendar-weekdays-fixed.txt',s);console.log('PASS: full syntax; obsolete G4:H5 clearing removed; query R3');
