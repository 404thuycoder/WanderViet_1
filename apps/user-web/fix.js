
const fs = require('fs');
const file = 'css/planner.css';
let css = fs.readFileSync(file, 'utf8');

const marker = 'VISUAL UPGRADE v3';
let splitIndex = css.indexOf(marker);

if (splitIndex !== -1) {
  let baseCss = css.substring(0, splitIndex);
  let v3Css = css.substring(splitIndex);

  // Instead of regex parsing, I will just prepend [data-theme='dark'] to specific main selectors that mess up the light theme background
  
  const selectorsToPrefix = [
    '.planner-main-wrapper',
    '.planner-form-card',
    '.planner-mode-selector',
    '.mode-toggle-btn',
    '.planner-sidebar',
    '.sidebar-dest-item',
    '.sidebar-stat-item',
    '.sidebar-tip-item',
    '.sidebar-review-item',
    '.region-card',
    '.region-dest-panel',
    '.region-dest-card',
    '.style-chip',
    '.planner-input',
    'select.planner-input option',
    '.planner-btn.main-action',
    '.btn-refresh-dest'
  ];
  
  selectorsToPrefix.forEach(sel => {
    // Replace all occurrences of these selectors that start a line
    let regex = new RegExp('^' + sel.replace(/\./g, '\\.') + ' *(?={|,|:)', 'gm');
    v3Css = v3Css.replace(regex, '[data-theme=\
dark\] ' + sel);
  });
  
  fs.writeFileSync(file, baseCss + v3Css);
  console.log('Successfully prefixed v3 CSS with data-theme=dark');
} else {
  console.log('Marker not found');
}

