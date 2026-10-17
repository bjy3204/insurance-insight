export const CONSULTATION_FORM_CSS=`
.cf-page{box-sizing:border-box;width:794px;flex-shrink:0;height:1123px;padding:38px 42px;background:#fff;color:#25364a;font-family:Arial,'Malgun Gothic',sans-serif;font-size:14px;line-height:1.65;letter-spacing:0;overflow:hidden;position:relative;text-align:left}
.cf-page *{box-sizing:border-box}.cf-page .cf-heading{display:flex;align-items:center;gap:14px;margin:0 0 24px;padding:4px 0 18px;border-bottom:2px solid #7696b4}.cf-page .cf-mark{width:7px;height:38px;background:#7696b4;border-radius:4px;flex-shrink:0}.cf-page h1{margin:0;font-size:28px;line-height:38px;letter-spacing:-.8px;font-weight:700;color:#263e56}.cf-page h2{margin:0 0 10px;font-size:16px;line-height:24px;color:#304f6d;font-weight:700}.cf-page section{margin:0 0 18px}.cf-page table{border-collapse:collapse;table-layout:fixed;width:100%;font-size:14px;line-height:1.4}.cf-page th,.cf-page td{border:1px solid #d3dee8;padding:6px 8px;vertical-align:middle}.cf-page th{font-weight:500;background:#f0f5f9;text-align:center;color:#304f6d}.cf-page td{background:#fff}.cf-page .cf-details tr{height:34px}.cf-page .cf-address{margin-top:-1px}.cf-page .cf-address th{width:15%}.cf-page .cf-questions{margin:16px 0}.cf-page .cf-question{display:grid;grid-template-columns:27px minmax(0,1fr);gap:9px;margin:0 0 14px;min-height:62px}.cf-page .cf-question-number{width:25px;height:25px;line-height:25px;text-align:center;border-radius:7px;background:#edf3f8;color:#577b9a;font-size:11px;font-weight:700;margin-top:1px}.cf-page .cf-question p{margin:0;font-size:14px;line-height:23px;font-weight:600}.cf-page .cf-options{display:flex;flex-wrap:wrap;gap:6px 13px;margin-top:8px;font-size:13px;line-height:20px}.cf-page .cf-options>span{display:inline-flex;gap:5px;align-items:center;white-space:nowrap}.cf-page .cf-options i{display:inline-block;width:12px;height:12px;border:1px solid #8fa5b8;background:white;flex-shrink:0}.cf-page .cf-history tr{height:33px}.cf-page .cf-history thead th{font-weight:600}.cf-page .cf-vehicle{border-top:1px solid #e1e8ef;padding-top:14px;margin-top:18px}.cf-page .cf-rating thead tr{height:36px}.cf-page .cf-rating tbody tr{height:60px}.cf-page .cf-rating tbody th{background:white;text-align:left;padding:12px;font-weight:500}.cf-page .cf-rating td{text-align:center}.cf-page .cf-rating td i{display:inline-block;width:17px;height:17px;border:1px solid #c8d5df;border-radius:50%}.cf-page .cf-feedback{border-top:1px solid #e1e8ef;padding-top:16px;margin-top:20px}.cf-page .cf-answer{margin-top:12px}.cf-page .cf-answer p{margin:0 0 7px;font-size:14px;line-height:22px}.cf-page .cf-answer>div{height:23px}.cf-page .cf-referral-description{font-size:13px;line-height:22px;margin:0 0 12px}.cf-page .cf-referral tr{height:34px}.cf-page .cf-referral thead th{font-weight:600}.cf-page [contenteditable=true]{outline:none;border-radius:2px;cursor:text;min-width:12px;white-space:pre-wrap;overflow-wrap:anywhere}.cf-page [contenteditable=true]:focus{outline:none;background:transparent}
.cf-page{display:flex;flex-direction:column}
.cf-page>.cf-heading,.cf-page>section{flex-shrink:0}
.cf-page>section:last-child{margin-bottom:0}
.cf-journal>section:nth-of-type(2){flex:1;min-height:0;display:flex;flex-direction:column;margin-bottom:0}
.cf-journal .cf-questions{flex:1;display:grid;grid-template-rows:repeat(4,minmax(0,1fr));gap:0;margin:16px 0}
.cf-journal .cf-question{margin:0;min-height:76px;padding-bottom:16px;align-content:start}
.cf-journal .cf-history{flex-shrink:0}
.cf-journal .cf-vehicle{margin-top:18px}
.cf-survey>section:last-child{margin-top:auto}
.cf-page .cf-heading{border-bottom-color:var(--cf-color,#7696b4)}
.cf-page .cf-mark{background:var(--cf-color,#7696b4)}
.cf-page h1,.cf-page h2,.cf-page th{color:var(--cf-color,#304f6d)}
.cf-page th{background:var(--cf-soft,#f0f5f9)}
.cf-page th,.cf-page td{border-color:var(--cf-line,#d3dee8)}
.cf-page .cf-question-number{color:var(--cf-color,#7696b4);background:var(--cf-soft,#edf3f8)}
.cf-page [contenteditable=true]:focus{outline:none;box-shadow:none}
.cf-page h2,.cf-page th,.cf-page .cf-question p,.cf-page .cf-options,.cf-page .cf-answer p,.cf-page .cf-referral-description{color:#111}
.cf-page h2 .cf-section-star{color:var(--cf-color,#7696b4);user-select:none}
@media print{.cf-page{margin:0!important;break-after:page;page-break-after:always;print-color-adjust:exact;-webkit-print-color-adjust:exact}.cf-page:last-child{break-after:auto;page-break-after:auto}.cf-page [contenteditable]{outline:none!important}}
`;
