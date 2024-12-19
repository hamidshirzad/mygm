print(default_api.write_file(path="./web/gemini-api.test.js", content="const { expect } = require('chai');\nconst geminiApi = require('./gemini-api'); // Assuming gemini-api.js exports a function\n\ndescribe('Gemini API Tests', () => {\n  it('should call the Gemini API with a prompt', async () => {\n    const response = await geminiApi({ prompt: 'test prompt' });\n    expect(response).to.exist; \n    // Add more assertions based on the expected response\n  });\n\n  it('should handle various parameters', async () => {\n    const response = await geminiApi({\n      prompt: 'test with parameters',\n      model: 'gemini-pro',\n      temperature: 0.7,\n      max_output_tokens: 100,\n    });\n    expect(response).to.exist;\n    // Add more assertions based on the expected response with parameters\n  });\n\n  it('should handle missing prompt parameter', async () => {\n    try {\n        await geminiApi({});\n        expect.fail('Expected an error');\n    } catch (error) {\n        expect(error.message).to.contain('prompt is required'); // Expected error message\n    }\n  });\n\n  it('should handle invalid model parameter', async () => {\n    try {\n        await geminiApi({prompt: 'test', model: 'invalid-model'});\n        expect.fail('Expected an error');\n    } catch (error) {\n        expect(error.message).to.contain('invalid model'); // Expected error message\n    }\n  });\n\n  it('should handle errors gracefully', async () => {\n    // Simulate an error scenario, e.g., network error\n    try {\n        await geminiApi({prompt: 'error-test'});\n        expect.fail('Expected an error');\n    } catch (error) {\n        expect(error).to.exist;  // Expect an error object\n        // More specific assertion on the error\n    }\n});\n});"))
/**
 * Calls the given Gemini model with the given image and/or text
 * parts, streaming output (as a generator function).
 */
export async function* streamGemini({
  model = 'gemini-1.5-flash', // or gemini-1.5-pro
  contents = [],
} = {}) {
  // Send the prompt to the Python backend
  // Call API defined in main.py
  let response = await fetch("/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model, contents })
  });

  yield* streamResponseChunks(response);
}
/**
 * A helper that streams text output chunks from a fetch() response.
 */
async function* streamResponseChunks(response) {
  let buffer = '';

  const CHUNK_SEPARATOR = '\n\n';

  let processBuffer = async function* (streamDone = false) {
    while (true) {
      let flush = false;
      let chunkSeparatorIndex = buffer.indexOf(CHUNK_SEPARATOR);
      if (streamDone && chunkSeparatorIndex < 0) {
        flush = true;
        chunkSeparatorIndex = buffer.length;
      }
      if (chunkSeparatorIndex < 0) {
        break;
      }

      let chunk = buffer.substring(0, chunkSeparatorIndex);
      buffer = buffer.substring(chunkSeparatorIndex + CHUNK_SEPARATOR.length);
      chunk = chunk.replace(/^data:\s*/, '').trim();
      if (!chunk) {
        if (flush) break;
        continue;
      }
      let { error, text } = JSON.parse(chunk);
      if (error) {
        console.error(error);
        throw new Error(error?.message || JSON.stringify(error));
      }
      yield text;
      if (flush) break;
    }
  };

  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += new TextDecoder().decode(value);
      console.log(new TextDecoder().decode(value));
      yield* processBuffer();
    }
  } finally {
    reader.releaseLock();
  }

  yield* processBuffer(true);
}
