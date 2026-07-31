const fs = require('fs');

const lines = fs.readFileSync('C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\a513990a-8a90-4f31-93fe-53aad5460d51\\.system_generated\\logs\\transcript_full.jsonl', 'utf-8').split('\n').filter(Boolean);

let fileContent = '';
for (const line of lines) {
  try {
    const data = JSON.parse(line);
    if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
      for (const call of data.tool_calls) {
        if (call.function.name === 'write_to_file') {
          const args = JSON.parse(call.function.arguments);
          if (args.TargetFile && args.TargetFile.includes('[propertyTickerId]') && args.CodeContent) {
            console.log("Found write_to_file arguments");
            fileContent = args.CodeContent;
          }
        }
      }
    }
    if (data.type === 'SYSTEM' && data.content && data.content.includes('File Path:') && data.content.includes('[propertyTickerId]')) {
      console.log('Found view_file output');
      fileContent = data.content; // fallback
    }
  } catch (e) {
  }
}

if (fileContent) {
  fs.writeFileSync('d:\\Project\\Milestono Investments\\recovered.txt', fileContent);
  console.log('Saved to recovered.txt');
} else {
  console.log('Not found in transcript.');
}
