import express from 'express';
import * as dotenv from 'dotenv';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

dotenv.config();

const router = express.Router();

import OpenAI from 'openai';
import { transform } from 'typescript';
// import text from 'body-parser/lib/types/text';

const openai = new OpenAI();

// const openai = new OpenAIApi(configuration);

async function generateVisualFromQuote(quote, theme, formality, color = "white", style) {
    // if (!quote || !theme || !formality) {
    //     throw new Error("Quote, theme, and formality are required parameters.");
    // }
    if (color === "") {
        color = "white";
    }

    console.log(`Processing quote: ${quote}, theme: ${theme}, formality: ${formality}, color: ${color}`);

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `
                    You are assisting with Blueberry AI, a web-based, AI-powered platform designed to transform quotes into visually engaging and easily understandable representations.

                    Task:
                    - I will provide you with a quote, a theme, and a formality level.
                    - Extract key concepts and align them with a metaphorical framework:

                      Metaphor Framework:
                      - A: The Undesired Initial State (before the transition).
                      - B: The Desired End State (after the transition).
                      - C: The Foundation or Bridge enabling the transition from A to B.

                    Guidelines:
                    - Use the theme to interpret and extract meaningful representations of A, B, and C.
                    - Represent A, B, and C with up to three words (capitalize the first letter of each word).
                    - Adjust tone based on the formality level:
                      - Neutral: Balanced.
                      - Formal: Professional.
                      - Informal: Casual, modern language. Gen Z Slang. TikTok 2022 Language.
                    
                    Ensure clarity and prioritize the essence of the visual metaphor.
                `
            },
            { role: "user", content: quote },
            { role: "user", content: `Theme: ${theme}` },
            { role: "user", content: `Formality: ${formality}` }
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "quote_analysis_schema",
                schema: {
                    type: "object",
                    properties: {
                        subpart1: { type: "string", description: "The undesired initial state (A)." },
                        subpart2: { type: "string", description: "The desired end state (B)." },
                        subpart3: { type: "string", description: "The bridge enabling the transition (C)." },
                        summary: { type: "string", description: "The summarized quote." }
                    },
                    additionalProperties: false
                }
            }
        }
    });

    const content = JSON.parse(completion.choices[0].message.content);
    const { subpart1, subpart2, subpart3, summary } = content;

    console.log("Extracted elements:", { subpart1, subpart2, subpart3, summary });

    console.log("Style:", style);

    let templatePath;
    let yOffset = 0;

    if (style === 'sketch') {
        templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/Bridge-Trspt-8.png');
        yOffset = -80;

        if (color === "white") {
            color = "black";
        }
    } else {
        templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/template.png'); // Default template
    }
    const outputPath = path.join('/workspaces/typescript-node-4/blueberry/backend/output.png');

    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const lines = quote.match(/.{1,30}(\s|$)/g) || []; // Handle cases where quote is short or empty

    const svgOverlay = `
        <svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
            <!-- Top Left Text -->
            <text x="250" y="${360 + yOffset}" font-size="30" fill="${color}" text-anchor="middle" font-family="Roboto">${escapeHtml(subpart1)}</text>
            
            <!-- Top Right Text -->
            <text x="750" y="${360 + yOffset}" font-size="30" fill="${color}" text-anchor="middle" font-family="Roboto">${escapeHtml(subpart2)}</text>
            
            <!-- Center Text (Grind Mode) -->
            <text x="500" y="${670 + yOffset}" font-size="35" fill="${color}" text-anchor="middle" font-family="Roboto" font-weight="700">${escapeHtml(subpart3)}</text>
            
            <!-- Theme Label -->
            <text x="500" y="${770 + yOffset}" font-size="28" fill="${color}" text-anchor="middle" font-family="Roboto" font-weight="400">Theme: ${theme}</text>
            
            <!-- Bottom Bold Text -->
            ${lines.map((line, index) => `
                <text x="500" y="${810 + index * 40 + yOffset}" font-size="30" fill="${color}" text-anchor="middle" font-family="Roboto" font-weight="700">
                    ${escapeHtml(line.trim())}
                </text>`).join('')}
        </svg>
    `;


    try {
        if (!svgOverlay || typeof svgOverlay !== "string") {
            throw new Error("Invalid SVG data.");
        }

        await sharp(templatePath)
            .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
            .toFile(outputPath);

        console.log("Image generated successfully:", outputPath);
        return [outputPath, completion.choices[0].message, completion.model];
    } catch (error) {
        console.error("Error generating visual:", error);
        throw error;
    }
}

async function generateVisualFromQuoteBraid(quote, theme, formality, color = "black", style) {
    if (color === "") {
        color = "black";
    }

    console.log(`Processing quote: ${quote}, theme: ${theme}, formality: ${formality}, color: ${color}`);

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `
                    You are a tool designed to transform quotes into clear and concise visuals that enhance understanding and engagement.

                    Task:
                    - I will provide you with a quote, a theme, and a formality level.
                    - Extract and distill the most relevant key words into a framework:
                      1) A metaphorical braid where three elements combine to produce a desired outcome.
                      2) Each element is captured in up to three words, capitalized appropriately.
                      3) The desired outcome is described in up to two words.

                    Guidelines:
                    - Use the theme as a guiding lens to analyze the quote and derive the elements.
                    - Adjust tone based on the formality level:
                      - Neutral: Balanced.
                      - Formal: Professional.
                      - Informal: Casual, modern language. Gen Z Slang. TikTok 2022 Language.
                    - The extracted elements should represent:
                      - A: The first strand.
                      - B: The second strand.
                      - C: The third strand.
                      - Outcome: The final transformation.

                    Think deeply, ensure clarity, and prioritize the essence of the quote and visual metaphor.
                `
            },
            { role: "user", content: quote },
            { role: "user", content: `Theme: ${theme}` },
            { role: "user", content: `Formality: ${formality}` }
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "quote_analysis_schema",
                schema: {
                    type: "object",
                    properties: {
                        subpart1: { type: "string", description: "The first strand of the braid" },
                        subpart2: { type: "string", description: "The second strand of the braid" },
                        subpart3: { type: "string", description: "The third strand of the braid" },
                        transformation: { type: "string", description: "The final transformation" },
                        summary: { type: "string", description: "The summarized quote" }
                    },
                    additionalProperties: false
                }
            }
        }
    });

    const content = JSON.parse(completion.choices[0].message.content);
    const { subpart1, subpart2, subpart3, transformation, summary } = content;

    console.log("Extracted elements:", { subpart1, subpart2, subpart3, transformation, summary });

    console.log("Style:", style);

    let templatePath;
    let yOffset = 0;

    if (style === 'sketch') {
        templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/Braid-Trspt.png');
        yOffset = -80;
        color = "black";

        // if (color === "black") {
        //     color = "white";
        // }
    } else {
        templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/braid.png'); // Default template
    }
    const outputPath = path.join('/workspaces/typescript-node-4/blueberry/backend/braidoutput.png');

    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const svgOverlay = `
        <svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    .text { font-family: 'San Francisco', sans-serif; font-size: 28.57px; fill: ${color}; }
                    .highlight { font-weight: bold; fill: #007aff; } /* Apple blue */
                </style>
            </defs>
            <text x="428.57" y="${214.29 + yOffset * 1.4286}" class="text" text-anchor="middle">${escapeHtml(subpart1)}</text>
            <text x="214.29" y="${414.29 + yOffset * 1.4286}" class="text" text-anchor="middle">${escapeHtml(subpart2)}</text>
            <text x="214.29" y="${714.29 + yOffset * 1.4286}" class="text" text-anchor="middle">${escapeHtml(subpart3)}</text>
            <text x="785.71" y="${428.57 + yOffset * 1.4286}" class="text highlight" text-anchor="middle">${escapeHtml(transformation)}</text>
            <text y="${885.71 + yOffset * 1.4286}" class="text" text-anchor="middle">
                ${summary.split(' ').reduce((acc, word) => {
                    const lastLine = acc[acc.length - 1];
                    if (lastLine && (lastLine.length + word.length) < 40.71) {
                        acc[acc.length - 1] = lastLine + ' ' + word;
                    } else {
                        acc.push(word);
                    }
                    return acc;
                }, []).map((line, index) => `
                    <tspan x="500" dy="${index === 0 ? 0 : 35.71}" class="highlight">
                        ${escapeHtml(line.trim())}
                    </tspan>`).join('')}
            </text>
        </svg>
    `;


    try {
        await sharp(templatePath)
            .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
            .toFile(outputPath);

        console.log("Image generated successfully:", outputPath);
        return [outputPath, completion.choices[0].message, completion.model];
    } catch (error) {
        console.error("Error generating visual:", error);
        throw error;
    }
}

async function generateVisualFromQuoteFish(quote, theme, formality, color = "white", style) {
    // if (!quote || !theme || !formality) {
    //     throw new Error("Quote, theme, and formality are required parameters.");
    // }
    if (color === "") {
        color = "white";
    }

    console.log(`Processing quote: ${quote}, theme: ${theme}, formality: ${formality}, color: ${color}`);

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `
                    You are a specialized tool designed to transform quotes into clear, concise visuals that enhance understanding and engagement.

                    Task:
                    - Extract the most relevant key concepts from the provided quote.
                    - Summarize these concepts to align with the metaphorical meaning of the visual: 
                      **The tension and interplay between individuality and conformity.**
                    - The summary should be concise (no longer than 15 tokens), insightful, and reflective of the quote's essence.

                    Guidelines:
                    - Use the provided theme and formality level to influence your interpretation.
                    - The theme is essential to contextualizing the extracted insight.
                    - Adjust the tone of the summary to match the formality level:
                        - **Neutral**: A balance between formal and informal.
                        - **Formal**: Polished and professional.
                        - **Informal**: Incorporate casual or modern expressions.
                    
                    Prioritize clarity, relevance, and alignment with the visual's intended meaning.
                `
            },
            { role: "user", content: quote },
            { role: "user", content: `Theme: ${theme}` },
            { role: "user", content: `Formality: ${formality}` }
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "quote_analysis_schema",
                schema: {
                    type: "object",
                    properties: {
                        insight: {
                            type: "string",
                            description: "The distilled insight extracted from the quote. No more than 15 tokens."
                        }
                    },
                    additionalProperties: false
                }
            }
        }
    });

    const content = JSON.parse(completion.choices[0].message.content);
    const { insight } = content;

    console.log("Extracted insight:", insight);

    console.log("Style:", style);

    let templatePath;
    let yOffset = 0;

    if (style === 'sketch') {
        templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/Fish-Trspt-8.png');
        yOffset = -80;
        color = "black";

        // if (color === "black") {
        //     color = "white";
        // }
    } else {
        templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/fish.png'); // Default template
    }
    const outputPath = path.join('/workspaces/typescript-node-4/blueberry/backend/fishoutput.png');

    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };
    // Split the insight into lines of up to 30 characters for better visualization
    const lines = insight.match(/.{1,25}(\s|$)/g);

    // Create an SVG overlay with the extracted text
    const svgOverlay = `
        <svg width="950" height="950" xmlns="http://www.w3.org/2000/svg">
            ${lines.map((line, index) => `
                <text 
                    x="50%" 
                    y="${200 + index * 60}" 
                    font-size="44" 
                    fill="${color}" 
                    text-anchor="middle" 
                    dominant-baseline="middle"
                    font-family="Roboto, Arial, sans-serif" 
                    font-weight="700"
                >
                    ${escapeHtml(line.trim())}
                </text>
            `).join('')}    
        </svg>
    `;


    try {
        await sharp(templatePath)
            .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
            .toFile(outputPath);

        console.log("Image generated successfully:", outputPath);
        return [outputPath, completion.choices[0].message, completion.model];
    } catch (error) {
        console.error("Error generating insight visual:", error);
        throw error;
    }
}

async function generateVisualFromQuoteNewton(quote, theme, keyword, formality, color = "white", style) {
    // if (!quote || !theme || !formality) {
    //     throw new Error("Quote, theme, and formality are required parameters.");
    // }
    if (color === "") {
        color = "white";
    }

    console.log(`Processing quote: ${quote}, theme: ${theme}, formality: ${formality}, keyword: ${keyword}, color: ${color}`,);

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `
                    You are a web-based, AI-powered platform designed to transform quotes into visually engaging and easily understandable representations.


                     Task Instructions:
                    1. I will provide you with a quote, a theme, keyword and a formality level.
                    2.Summarize the key concepts to align with the metaphorical meaning of the visual: 
                      **Cause and effect, when one action or event directly leads to another outcome**
                    3. Extract a single keyword that best represent the cause.
                    4. Create a 5 word summary using the keyword as the first word 

                    Guidelines:
                    - Ensure the five words convey the core essence of the original quote.
                    - The keyword must be the cause that effects or leads to another outcome
                    - The key word must be the first word in the summary.
                    - Ensure the summary is grammatically correct and a coherent sentence
                    - Consider the provided theme as context to guide your interpretation.
                    - Adjust the tone of the statement to match the requested formality level:
                        - **Neutral**: Balanced between formal and informal.
                        - **Formal**: Polished and professional.
                        - **Informal**: Casual, modern, and conversational.
                    
                    example: You build your own momentum
                    keyword: momentum

                    Prioritize clarity, depth, and alignment with the theme and formality level. The result should be insightful and reflective of the original quote.
                `
            },
            { role: "user", content: quote },
            { role: "user", content: `Theme: ${theme}` },
            { role: "user", content: `Keyword: ${keyword}` },
            { role: "user", content: `Formality: ${formality}` }
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "quote_analysis_schema",
                schema: {
                    type: "object",
                    properties: {
                        insight: {
                            type: "string",
                            description: "A concise five-word transformation of the quote."
                        }
                    },
                    additionalProperties: false
                }
            }
        }
    });

    const content = JSON.parse(completion.choices[0].message.content);
    const { insight } = content;

    console.log("Extracted insight:", insight);

    console.log("Style:", style);

    let templatePath;
    let yOffset = 0;

    if (style === 'sketch') {
        console.log("WEEEE");
        templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/Cradle-Trspt.png');
        yOffset = -80;
        color = "black";

        // if (color === "black") {
        //     color = "white";
        // }
    } else {
        templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/newton.png'); // Default template
    }
    const outputPath = path.join('/workspaces/typescript-node-4/blueberry/backend/newtonoutput.png');

    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    // Split the five-word statement into lines for better rendering
    const lines = insight.match(/.{1,25}(\s|$)/g);

    // Create an SVG overlay with the extracted text
    const svgOverlay = `
        <svg width="950" height="950" xmlns="http://www.w3.org/2000/svg">
            ${lines.map((line, index) => `
                <text 
                    x="50%" 
                    y="${200 + index * 60}" 
                    font-size="44" 
                    fill="${color}" 
                    text-anchor="middle" 
                    dominant-baseline="middle"
                    font-family="Roboto, Arial, sans-serif" 
                    font-weight="700"
                >
                    ${escapeHtml(line.trim())}
                </text>
            `).join('')}    
        </svg>
    `;

    try {
        await sharp(templatePath)
            .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
            .toFile(outputPath);

        console.log("Image generated successfully:", outputPath);
        return [outputPath, completion.choices[0].message, completion.model];
    } catch (error) {
        console.error("Error generating insight visual:", error);
        throw error;
    }
}

async function generateThemes(prompt) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `
                        Transform the following quote into a three concise, actionable themes that capture its core message. 
                        The themes should be framed to enhance understanding and encourage engagement. 
                        Instructions: Identify the primary ideas or lessons conveyed in the quote. Break these into succinct themes (3-7 words each) with a concise description of the theme. Ensure the themes are clear, relevant, and engaging.

                `
            },
            {
                role: "user",
                content: prompt
            }
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "quote_analysis_schema",
                schema: {
                    type: "object",
                    properties: {
                        theme1: {
                            // description: "Part A (The Initial State. Before Bridge.). Capitalize the first letter of each word.",
                            type: "string"
                        },
                        theme2: {
                            type: "string"
                        },
                        theme3: {
                            type: "string"
                        },
                    },
                    additionalProperties: false
                }
            }
        }
    });

    console.log(completion.choices[0].message);

    // Parse the JSON content
    const content = JSON.parse(completion.choices[0].message.content);

    console.log(content);
    return content;
}


router.route('/').get((req, res) => {
  res.status(200).json({ message: 'Hello from DALL-E!' });
});

router.route('/').post(async (req, res) => {
  try {
    const { prompt, theme, color, formality, style } = req.body;

    const [outputPath, textBridge, modelBridge]  = await generateVisualFromQuote(prompt, theme, formality, color, style);
    const imageBuffer = fs.readFileSync(outputPath);
    const imageBase64 = imageBuffer.toString('base64');

    const [outputPathBraid, textBraid, modelBraid ] = await generateVisualFromQuoteBraid(prompt, theme, formality, color, style);
    const imageBufferBraid = fs.readFileSync(outputPathBraid);
    const imageBase64Braid = imageBufferBraid.toString('base64');

    const [fishOutputPath, textFish, modelFish] = await generateVisualFromQuoteFish(prompt, theme, formality, color, style);
    const fishImageBuffer = fs.readFileSync(fishOutputPath);
    const fishImageBase64 = fishImageBuffer.toString('base64');

    const [newtonOutputPath, textNewton, modelNewton] = await generateVisualFromQuoteNewton(prompt, theme, "", formality, color, style);
    const newtonImageBuffer = fs.readFileSync(newtonOutputPath);
    const newtonImageBase64 = newtonImageBuffer.toString('base64');

    res.status(200).json({ 
        photo: imageBase64, 
        braid: imageBase64Braid, 
        fish: fishImageBase64, 
        newton: newtonImageBase64,
        textBridge: textBridge,
        textBraid: textBraid,
        textFish: textFish,
        textNewton: textNewton,
        modelBridge: modelBridge,
        modelBraid: modelBraid,
        modelFish: modelFish,
        modelNewton: modelNewton
    });

    // res.status(200).json({ photo: image });
  } catch (error) {
    console.error(error);
    // res.status(500).send(error?.response.data.error.message || 'Something went wrong');
  }
});

router.route('/theme').post(async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log(prompt);
    
        const content = await generateThemes(prompt);

        const theme1 = content.theme1;
        const theme2 = content.theme2;
        const theme3 = content.theme3;
        
    
        res.status(200).json({ theme1, theme2, theme3 });
    } catch (error) {
        console.error(error);
        res.status(500).send(error?.response.data.error.message || 'Something went wrong');
    }
});

export default router;