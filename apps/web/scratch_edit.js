const fs = require('fs');
const path = 'src/features/properties/PropertyCard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the start of the list view with a Link
content = content.replace(
  /return \(\s*<Box\s+sx={{\s*bgcolor: '#FFFFFF',/,
  `return (
    <Box
      component={Link}
      href={\`/property/\${property.slug}\`}
      sx={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        bgcolor: '#FFFFFF',`
);

// We need to clean up inner components which were Links.
const lines = content.split('\n');
for (let i = 400; i < lines.length; i++) {
  // we do NOT want to remove the component={Link} we JUST added at the list view return
  // so we check if the line contains it, and if it's NOT the first one we added
  // But wait, the list view return is at line ~430. 
  // Let's just blindly remove them if they are exactly `            component={Link}` or similar indent.
  // Actually, a better way: 
  if (lines[i].includes('component={Link}') && !lines[i].includes('display: \'block\'')) {
      // The one we added is followed by sx={{ display: 'block' }}, but it's on a different line.
      // Let's just do an exact match of the lines that have it.
      if (lines[i].trim() === 'component={Link}') {
          lines[i] = '';
      }
      if (lines[i].trim() === 'component={Link} // Link') {
          lines[i] = '';
      }
  }
  
  if (lines[i].trim() === 'href={`/property/${property.slug}`}') {
      lines[i] = '';
  }
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Done');
