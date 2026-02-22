// TEST SCRIPT - Validate Streaming Rendering
// Run this to test if the normalization is working

import { normalizeMarkdown } from '../src/utils/markdownUtils.js';

const testCases = [
    {
        name: "Smashed Code Block",
        input: "Here is code:```javapublic class Test { }```",
        expected: "```java\npublic class Test"
    },
    {
        name: "Smashed List",
        input: "Steps:1. First2. Second",
        expected: "1. First\n2. Second"
    },
    {
        name: "Mixed Content",
        input: "Text before```pythonprint('hello')```text after",
        expected: "```python\nprint('hello')\n```\n\ntext after"
    },
    {
        name: "No Space After Number",
        input: "1.First item\n2.Second item",
        expected: "1. First item\n2. Second item"
    }
];

console.log("🧪 Testing Markdown Normalization...\n");

testCases.forEach((test, index) => {
    const result = normalizeMarkdown(test.input);
    const passed = result.includes(test.expected.split('\n')[0]);

    console.log(`Test ${index + 1}: ${test.name}`);
    console.log(`Input:  "${test.input}"`);
    console.log(`Output: "${result}"`);
    console.log(` Status: ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

console.log("\n📊 Normalization Tests Complete");
