# Testing the Backend Improvements

## Quick Test Steps

### 1. Compile the Backend

```bash
cd backend
./mvnw clean compile
```

Expected output:
```
[INFO] BUILD SUCCESS
```

### 2. Run the Backend

```bash
./mvnw spring-boot:run
```

Wait for:
```
Started CortexAiAssistantApplication in X.XXX seconds
```

### 3. Test the Enhanced Stream Endpoint

Open a new terminal and run:

```bash
curl -X POST http://localhost:8080/api/v1/ollama/stream \
  -H "Content-Type: application/json" \
  -d '{"model": "mistral:latest", "prompt": "write a simple hello world in java"}'
```

### 4. Verify the Response

You should see structured JSON responses like:

```
data: {"type": "content", "content": "Here is a simple Java program..."}
data: {"type": "code_start", "language": "java", "content": "```java"}
data: {"type": "content", "content": "class HelloWorld {\n"}
data: {"type": "content", "content": "    public static void main(String[] args) {\n"}
data: {"type": "content", "content": "        System.out.println(\"Hello, World!\");\n"}
data: {"type": "content", "content": "    }\n"}
data: {"type": "content", "content": "}\n"}
data: {"type": "code_end", "content": "```"}
data: {"type": "done", "message": "Stream complete"}
```

### 5. Verify the Improvements

Check for these key improvements:

✅ **Prompt Enhancement:**
- LLM should produce better formatted output
- Code blocks should be properly closed
- Explanations should be outside code

✅ **Post-Processing:**
- Code blocks have newlines (not one line)
- No text inside code blocks
- Proper spacing between elements

✅ **Structured Response:**
- JSON format with `type` field
- `code_start` and `code_end` events
- `done` event at the end

### 6. Test with Frontend

**Start frontend:**
```bash
cd frontend
npm run dev
```

**Test in browser:**
1. Open http://localhost:5173
2. Ask: "write a java hello world code"
3. Verify:
   - ✅ Code block renders properly
   - ✅ Has line breaks (not one line)
   - ✅ No text inside code block
   - ✅ Proper syntax highlighting

---

## What to Look For

### ✅ Good Signs

1. **Backend logs show:**
   ```
   Calling Ollama API with enhanced prompt
   Successfully generated and processed text response
   ```

2. **Response contains:**
   - Properly formatted JSON
   - `type` field in each chunk
   - Code blocks with language tags
   - Completion event at end

3. **Frontend renders:**
   - Clean code blocks
   - Proper indentation
   - No merged text/code
   - Syntax highlighting works

### ❌ Issues to Watch For

1. **Backend errors:**
   - Import errors (run `mvnw clean compile`)
   - Service injection errors (check @Service annotations)
   - JSON parsing errors (check escapeJson method)

2. **Response issues:**
   - Missing newlines in code
   - Text still appears in code blocks
   - No `done` event

3. **Frontend issues:**
   - Still seeing one-line code
   - Text merged with code
   - No syntax highlighting

---

## Troubleshooting

### Issue: Backend won't compile

**Solution:**
```bash
cd backend
./mvnw clean install -DskipTests
```

### Issue: Frontend still showing old format

**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check browser console for errors
3. Verify backend is running on correct port

### Issue: LLM still sends bad format

**Solution:**
- Check PromptEnhancer is being used
- Verify LLMPostProcessor is processing chunks
- Look at backend logs for enhancement messages

---

## Success Criteria

✅ Backend compiles without errors
✅ Backend starts successfully
✅ Stream endpoint returns JSON
✅ JSON contains `type` field
✅ Code blocks have `code_start`/`code_end`
✅ Frontend receives structured data
✅ Code renders with proper formatting
✅ No text inside code blocks

---

## Next Steps After Testing

1. ✅ If all tests pass → Ready for production
2. ⚠️ If issues found → Check logs and troubleshoot
3. 📝 Document any custom configuration needed
4. 🚀 Deploy to production environment

---

**Happy Testing!** 🎉
