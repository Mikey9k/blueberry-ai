import express from 'express';
import * as dotenv from 'dotenv';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

dotenv.config();

const router = express.Router();

import OpenAI from 'openai';
// import text from 'body-parser/lib/types/text';

const openai = new OpenAI();

// const openai = new OpenAIApi(configuration);

import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads an image to Cloudinary.
 * @param {string} filePath - The path to the image file.
 * @returns {Promise<string>} - The URL of the uploaded image.
 */
async function uploadImageToCloudinary(filePath, userId, version, tag) {
    try {

        const combinedId = `${userId}_v${version}_${tag}`;

        const result = await cloudinary.uploader.upload(filePath, {
            // folder: 'your_folder_name', // Optional: specify folder in Cloudinary
            public_id: combinedId, // Combine userId and version for unique public ID
            overwrite: true, // Optional: overwrite the image if it already exists
            invalidate: true, // Optional: invalidate the image in CDN caches
        });
      return result.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  }

async function generateVisualFromQuote(options) {
    let { quote, theme, formality, color, style, isQuoteDisplayed, isSummaryDisplayed, userId, version } = options;

    // if (!quote || !theme || !formality) {
    //     throw new Error("Quote, theme, and formality are required parameters.");
    // }
    if (color === "") {
        color = "white";
    }

    console.log(`Processing quote: ${quote}, theme: ${theme}, formality: ${formality}, 
        color: ${color}, style: ${style}`, isQuoteDisplayed, isSummaryDisplayed);

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `
                    Context: 

                    - You are an AI-powered platform designed to transform quotes into visually engaging and easily understandable representations.

                    Metaphorical Frameworks: 

                   
                    - **Transformation**: Represents a journey of personal growth or evolution.
                    

                    Task:

                    - You will be provided quote, a theme, and a formality level.
                    - Use the theme as a guiding lens to analyze and distill the essence of the quote based on the metaphorical framework.
                    - Output the results as:
                        - A: The Undesired Initial State (before the transition)
                        - B: The Desired End State (after the transitionn)
                        - C: The Bridge enabling the transition from A to B.
                        

                    Guidelines:

                    - Use the inteprepretation to extract meaningful representations of A, B, and C
                    - Represent A, B, and C with a key word or phrase (use a maximum of 5 output tokens).
                    - Replace overly figurative terms with more direct ,thematic or metaphorical synonyms where possible.
                    - Focus on clarity and grammatical correctness: , Use noun phrases with appropriate modifiers, Avoid reversing natural word order or leaving phrases incomplete.
                    - All outputs must be grammatically correct, using natural word order and proper modifiers

                    Adjust tone based on the formality level:
                    
                    - Neutral: Balanced.
                    - Formal: Professional.
                    - Informal: Very casual, modern language. Use slang and contractions.

                    Ensure clarity and prioritize the essence of the visual metaphor. Think carefully. 
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

    let templatePath;
    let yOffset = 0;

    // if (style === 'sketch') {
    //     templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/Bridge-Trspt-8.png');
    //     yOffset = -80;

    //     if (color === "white") {
    //         color = "black";
    //     }
    // } else {
    //     templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/template.png'); // Default template
    // }
    // const outputPath = path.join('/workspaces/typescript-node-4/blueberry/backend/output.png');

    // Three base templates:
    const templatePaths = 
        [
            path.join('/workspaces/typescript-node-4/blueberry/backend/Sketch_200_Bridge-72dpi.png'),
            path.join('/workspaces/typescript-node-4/blueberry/backend/BlueP_200_Bridge-72dpi.png'),
            path.join('/workspaces/typescript-node-4/blueberry/backend/Min_B_200_Bridge-72dpi.png')
        ]


    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const lines = quote.match(/.{1,30}(\s|$)/g) || []; // Handle cases where quote is short or empty

    const fontPath = path.resolve('/workspaces/typescript-node-4/blueberry/backend/fonts/IndieFlower-Regular.ttf');
    let fontData;
    // Check if the file exists
    if (fs.existsSync(fontPath)) {
        fontData = fs.readFileSync(fontPath).toString('base64');
        // console.log('Font data (base64):', fontData);
    } else {
        console.error('Font file does not exist:', fontPath);
    }

    const svgOverlay = `
        <svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style type="text/css">
                    @font-face {
                        font-family: 'Indie Flower';
                        src: url(data:font/ttf;base64,${fontData}) format('truetype');
                    }
                </style>
            </defs>
            <!-- Top Left Text -->
            <text x="250" y="${360 + yOffset}" font-size="40" fill="${color}" text-anchor="middle" font-family='Pangolin'>${escapeHtml(subpart1)}</text>
            
            <!-- Top Right Text -->
            <text x="750" y="${360 + yOffset}" font-size="40" fill="${color}" text-anchor="middle" font-family="Pangolin">${escapeHtml(subpart2)}</text>
            
            <!-- Center Text (C) -->
            <text x="500" y="${670 + yOffset}" font-size="45" fill="${color}" text-anchor="middle" font-family="Pangolin" font-weight="700">${escapeHtml(subpart3)}</text>
            
            <!-- Bottom Bold Text -->
            ${isQuoteDisplayed ? lines.map((line, index) => `
                <text x="500" y="${810 + index * 40 + yOffset}" font-size="30" fill="${color}" text-anchor="middle" font-family="Pangolin" font-weight="700">
                    ${escapeHtml(line.trim())}
                </text>`).join('') : ''}
        </svg>
    `;

    const svgOverlayWhite = `
    <svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <style type="text/css">
                @font-face {
                    font-family: 'Indie Flower';
                    src: url(data:font/ttf;base64,${fontData}) format('truetype');
                }
            </style>
        </defs>
        <!-- Top Left Text -->
        <text x="250" y="${360 + yOffset}" font-size="40" fill="white" text-anchor="middle" font-family='Pangolin'>${escapeHtml(subpart1)}</text>
        
        <!-- Top Right Text -->
        <text x="750" y="${360 + yOffset}" font-size="40" fill="white" text-anchor="middle" font-family="Pangolin">${escapeHtml(subpart2)}</text>
        
        <!-- Center Text (C) -->
        <text x="500" y="${670 + yOffset}" font-size="45" fill="white" text-anchor="middle" font-family="Pangolin" font-weight="700">${escapeHtml(subpart3)}</text>
        
        <!-- Bottom Bold Text -->
        ${isQuoteDisplayed ? lines.map((line, index) => `
            <text x="500" y="${810 + index * 40 + yOffset}" font-size="30" fill="white" text-anchor="middle" font-family="Pangolin" font-weight="700">
                ${escapeHtml(line.trim())}
            </text>`).join('') : ''}
    </svg>
`;

    try {
        if (!svgOverlay || typeof svgOverlay !== "string") {
            throw new Error("Invalid SVG data.");
        }

        // await sharp(templatePath)
        //     .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
        //     .toFile(outputPath);

        // Generate for each template
        const outputPaths = templatePaths.map((_, i) =>
            path.join('/workspaces/typescript-node-4/blueberry/backend', `bridge-${i}.png`)
        );

        await Promise.all(
            templatePaths.map((tplPath, i) => {
                if (i === 0) {
                    return sharp(tplPath)
                        .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
                        .toFile(outputPaths[i]);
                } else {
                    return sharp(tplPath)
                        .composite([{ input: Buffer.from(svgOverlayWhite), top: 0, left: 0 }])
                        .toFile(outputPaths[i]);
                }
            })
        );

        // console.log("Image generated successfully:", outputPath);

        const cloudinaryUrls = [];
        for (let i = 0; i < outputPaths.length; i++) {
            const url = await uploadImageToCloudinary(outputPaths[i], userId, version, `bridge-${i}`);
            cloudinaryUrls.push(url);
        }

        console.log("Images generated and uploaded successfully:", cloudinaryUrls);

        return [outputPaths, completion.choices[0].message, completion.model];
    } catch (error) {
        console.error("Error generating visual:", error);
        throw error;
    }


}

/**
 * generateVisualFromQuoteBraid
 * Refactored to match structure & logic of generateVisualFromQuote
 */
async function generateVisualFromQuoteBraid(options) {
    let {
        quote,
        theme,
        formality,
        color,
        style,
        isQuoteDisplayed,
        userId,
        version
    } = options;

    let isSummaryDisplayed = false;

    // Default color handling
    if (!color || color === "") {
        color = "black"; // or "white", depending on your preference
    }

    // For reference/logging
    console.log(`Processing (Braid) => Quote: ${quote}, Theme: ${theme}, Formality: ${formality}, 
        Color: ${color}, Style: ${style}, isQuoteDisplayed: ${isQuoteDisplayed}, isSummaryDisplayed: ${isSummaryDisplayed}`);

    // 1. Send prompt to OpenAI
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `
                    You are assisting with Blueberry AI, a web-based, AI-powered platform designed to transform quotes 
                    into visually engaging and easily understandable representations.

                    Task:
                    - I will provide you with a quote, a theme, and a formality level.
                    - Extract key concepts using a metaphorical "Braid" framework:
                      1) A metaphorical braid of three elements (strands) combining to produce a desired outcome.
                      2) Each strand is captured in up to three words, capitalized appropriately.
                      3) The desired outcome is described in up to two words.
                    
                    Guidelines:
                    - Use the theme as a guiding lens to analyze the quote and derive the elements.
                    - Adjust tone based on the formality level:
                      - Neutral: Balanced.
                      - Formal: Professional.
                      - Informal: Casual, modern language. Gen Z Slang. TikTok 2022 Language.
                    - The extracted elements should represent:
                      - A: The first strand
                      - B: The second strand
                      - C: The third strand
                      - Outcome: The final transformation

                    Ensure clarity and prioritize the essence of the visual braid metaphor.
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
                        summary: { type: "string", description: "A concise summary of the quote" }
                    },
                    additionalProperties: false
                }
            }
        }
    });

    // 2. Parse AI response
    const content = JSON.parse(completion.choices[0].message.content);
    const { subpart1, subpart2, subpart3, transformation, summary } = content;

    console.log("Extracted Braid elements:", {
        subpart1,
        subpart2,
        subpart3,
        transformation,
        summary
    });

    // 3. Prepare image templates (as in 'generateVisualFromQuote')
    //    Here, we're using multiple template paths for various styles or versions
    const templatePaths = [
        path.join('/workspaces/typescript-node-4/blueberry/backend/Sketch_200_Braid-72dpi.png'),
        path.join('/workspaces/typescript-node-4/blueberry/backend/BlueP_200_Braid-72dpi.png'),
        path.join('/workspaces/typescript-node-4/blueberry/backend/Min_B_200_Braid-72dpi.png')
    ];

    // 4. Helper function to escape HTML
    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    // Optional: Break the original quote into lines if we want to display it
    const lines = quote ? (quote.match(/.{1,30}(\s|$)/g) || []) : [];

    // 5. Load custom font if needed
    const fontPath = path.resolve('/workspaces/typescript-node-4/blueberry/backend/fonts/IndieFlower-Regular.ttf');
    let fontData;
    if (fs.existsSync(fontPath)) {
        fontData = fs.readFileSync(fontPath).toString('base64');
    } else {
        console.error('Font file does not exist:', fontPath);
    }

    // 6. Construct the SVG overlays
    //    We can show subpart1, subpart2, subpart3, transformation, plus summary/quote
    //    Positions below are examples; adjust to match your Braid template coordinates
    let yOffset = 0;
    const svgOverlayColor = `
        <svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style type="text/css">
                    @font-face {
                        font-family: 'Indie Flower';
                        src: url(data:font/ttf;base64,${fontData}) format('truetype');
                    }
                </style>
            </defs>
            <!-- Strand A -->
            <text x="250" y="${330 + yOffset}" font-size="25" fill="${color}" text-anchor="middle" font-family='Pangolin'>
                ${escapeHtml(subpart1)}
            </text>
            <!-- Strand B -->
            <text x="200" y="${500 + yOffset}" font-size="25" fill="${color}" text-anchor="middle" font-family='Pangolin'>
                ${escapeHtml(subpart2)}
            </text>
            <!-- Strand C -->
            <text x="250" y="${660 + yOffset}" font-size="25" fill="${color}" text-anchor="middle" font-family='Pangolin'>
                ${escapeHtml(subpart3)}
            </text>
            <!-- Transformation -->
            <text x="750" y="${450 + yOffset}" font-size="35" fill="${color}" text-anchor="middle" 
                  font-family="Pangolin" font-weight="700">
                ${escapeHtml(transformation)}
            </text>
            
            <!-- Summary (if isSummaryDisplayed) -->
            ${
                isSummaryDisplayed
                    ? `<text x="500" y="${680 + yOffset}" font-size="30" fill="${color}" text-anchor="middle" 
                         font-family="Pangolin" font-weight="700">
                         ${escapeHtml(summary)}
                       </text>`
                    : ''
            }

            <!-- Original Quote (if isQuoteDisplayed) -->
            ${
                isQuoteDisplayed 
                    ? lines.map((line, index) => `
                        <text x="500" y="${760 + (index * 40) + yOffset}" font-size="28" fill="${color}" 
                              text-anchor="middle" font-family="Pangolin" font-weight="400">
                            ${escapeHtml(line.trim())}
                        </text>
                    `).join('')
                    : ''
            }
        </svg>
    `;

    // Alternative overlay with white text (for different template background),
    // e.g., if you want a contrasting color for the second or third template
    const svgOverlayWhite = `
        <svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style type="text/css">
                    @font-face {
                        font-family: 'Indie Flower';
                        src: url(data:font/ttf;base64,${fontData}) format('truetype');
                    }
                </style>
            </defs>
            <!-- Strand A -->
            <text x="250" y="${330 + yOffset}" font-size="25" fill="white" text-anchor="middle" font-family='Pangolin'>
                ${escapeHtml(subpart1)}
            </text>
            <!-- Strand B -->
            <text x="200" y="${450 + yOffset}" font-size="25" fill="white" text-anchor="middle" font-family='Pangolin'>
                ${escapeHtml(subpart2)}
            </text>
            <!-- Strand C -->
            <text x="250" y="${660 + yOffset}" font-size="25" fill="white" text-anchor="middle" font-family='Pangolin'>
                ${escapeHtml(subpart3)}
            </text>
            <!-- Transformation -->
            <text x="750" y="${450 + yOffset}" font-size="35" fill="white" text-anchor="middle" 
                  font-family="Pangolin" font-weight="700">
                ${escapeHtml(transformation)}
            </text>

            <!-- Summary (if isSummaryDisplayed) -->
            ${
                isSummaryDisplayed
                    ? `<text x="500" y="${680 + yOffset}" font-size="30" fill="white" text-anchor="middle" 
                         font-family="Pangolin" font-weight="700">
                         ${escapeHtml(summary)}
                       </text>`
                    : ''
            }

            <!-- Original Quote (if isQuoteDisplayed) -->
            ${
                isQuoteDisplayed
                    ? lines.map((line, index) => `
                        <text x="500" y="${760 + (index * 40) + yOffset}" font-size="28" fill="white" 
                              text-anchor="middle" font-family="Pangolin" font-weight="400">
                            ${escapeHtml(line.trim())}
                        </text>
                    `).join('')
                    : ''
            }
        </svg>
    `;

    try {
        // 7. Composite the text overlay onto each template
        //    Example: first template with the chosen color, subsequent with white
        const outputPaths = templatePaths.map((_, i) =>
            path.join('/workspaces/typescript-node-4/blueberry/backend', `braid-${i}.png`)
        );

        // Create an array of overlay buffers for easier usage
        const overlays = [
            Buffer.from(svgOverlayColor),
            Buffer.from(svgOverlayWhite),
            Buffer.from(svgOverlayWhite)
        ];

        await Promise.all(
            templatePaths.map((tplPath, i) => {
                return sharp(tplPath)
                    .composite([{ input: overlays[i], top: 0, left: 0 }])
                    .toFile(outputPaths[i]);
            })
        );

        console.log("Braid images generated successfully:", outputPaths);

        // 8. (Optional) Upload each output to Cloudinary (or another storage)
        //    Only do this if you have the uploadImageToCloudinary function defined
        const cloudinaryUrls = [];
        for (let i = 0; i < outputPaths.length; i++) {
            const url = await uploadImageToCloudinary(
                outputPaths[i],
                userId,
                version,
                `braid-${i}`
            );
            cloudinaryUrls.push(url);
        }

        console.log("Images uploaded successfully:", cloudinaryUrls);

        // 9. Return the result
        return [outputPaths, completion.choices[0].message, completion.model];

    } catch (error) {
        console.error("Error generating Braid visual:", error);
        throw error;
    }
}


async function generateVisualFromQuoteFish(options) {
    // 1. Destructure options
    let { 
        quote, 
        theme, 
        formality, 
        color = "white", 
        style, 
        isQuoteDisplayed, 
        userId, 
        version 
    } = options;

    let isSummaryDisplayed = true;


    // 2. Provide default color if empty string
    if (color === "") {
        color = "white";
    }

    // 3. Log the parameters for debugging
    console.log(`Processing quote: ${quote}, theme: ${theme}, formality: ${formality}, 
        color: ${color}, style: ${style}, isQuoteDisplayed: ${isQuoteDisplayed}, isSummaryDisplayed: ${isSummaryDisplayed}`);

    // 4. Make the OpenAI call (GPT-4o-mini) with the fish metaphor system prompt
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
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

    // 5. Parse JSON response
    const content = JSON.parse(completion.choices[0].message.content);
    const { insight } = content;

    console.log("Extracted insight:", insight);

    // 6. Define multiple template paths (mirroring the multi-template logic)
    //    You can adjust/replace these with your actual fish-related image files.
    const templatePaths = 
        [
            path.join('/workspaces/typescript-node-4/blueberry/backend/Sketch_200_Fish-72dpi.png'),
            path.join('/workspaces/typescript-node-4/blueberry/backend/BlueP_200_Fish-72dpi.png'),
            path.join('/workspaces/typescript-node-4/blueberry/backend/Min_B_200_Fish-72dpi.png')
        ]

    // 7. Pre-generate output paths for each template
    const outputPaths = templatePaths.map((_, i) => 
        path.join('/workspaces/typescript-node-4/blueberry/backend', `fishOutput-${i}.png`)
    );

    // 8. Utility function to escape HTML
    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    // 9. Break the quote and insight into lines if needed
    const quoteLines = quote ? quote.match(/.{1,30}(\s|$)/g) || [] : [];
    const insightLines = insight ? insight.match(/.{1,25}(\s|$)/g) || [] : [];

    // 10. (Optional) Load your custom font if you have one
    const fontPath = path.resolve('/workspaces/typescript-node-4/blueberry/backend/fonts/IndieFlower-Regular.ttf');
    let fontData = null;
    if (fs.existsSync(fontPath)) {
        fontData = fs.readFileSync(fontPath).toString('base64');
    } else {
        console.error('Font file does not exist:', fontPath);
    }

    // 11. Create SVG overlays:
    //     - We'll display the insight in the center or near the top
    //     - We'll optionally display the original quote at the bottom if isQuoteDisplayed is true
    //     - We'll only display the insight if isSummaryDisplayed is true
    //     This mirrors the “multiple text fields” approach from the bridge function.

    // Primary SVG overlay (uses the user-specified color)
    const svgOverlay = `
        <svg width="950" height="950" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style type="text/css">
                    @font-face {
                        font-family: 'Indie Flower';
                        src: url(data:font/ttf;base64,${fontData}) format('truetype');
                    }
                </style>
            </defs>
            
            <!-- Display insight if isSummaryDisplayed -->
            ${
                isSummaryDisplayed
                ? insightLines.map((line, index) => `
                    <text 
                        x="50%" 
                        y="${200 + index * 60}" 
                        font-size="44" 
                        fill="${color}" 
                        text-anchor="middle" 
                        dominant-baseline="middle"
                        font-family="Pangolin" 
                        font-weight="700"
                    >
                        ${escapeHtml(line.trim())}
                    </text>
                  `).join('')
                : ''
            }

            <!-- Display quote if isQuoteDisplayed -->
            ${
                isQuoteDisplayed
                ? quoteLines.map((line, index) => `
                    <text 
                        x="50%" 
                        y="${600 + index * 40}" 
                        font-size="30" 
                        fill="${color}" 
                        text-anchor="middle" 
                        dominant-baseline="middle"
                        font-family="Roboto, Arial, sans-serif"
                    >
                        ${escapeHtml(line.trim())}
                    </text>
                  `).join('')
                : ''
            }
        </svg>
    `;

    // Secondary SVG overlay (forces white text, for demonstration/contrast)
    const svgOverlayWhite = `
        <svg width="950" height="950" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style type="text/css">
                    @font-face {
                        font-family: 'Indie Flower';
                        src: url(data:font/ttf;base64,${fontData}) format('truetype');
                    }
                </style>
            </defs>

            <!-- Display insight if isSummaryDisplayed -->
            ${
                isSummaryDisplayed
                ? insightLines.map((line, index) => `
                    <text 
                        x="50%" 
                        y="${200 + index * 60}" 
                        font-size="44" 
                        fill="white" 
                        text-anchor="middle" 
                        dominant-baseline="middle"
                        font-family="Pangolin" 
                        font-weight="700"
                    >
                        ${escapeHtml(line.trim())}
                    </text>
                  `).join('')
                : ''
            }

            <!-- Display quote if isQuoteDisplayed -->
            ${
                isQuoteDisplayed
                ? quoteLines.map((line, index) => `
                    <text 
                        x="50%" 
                        y="${600 + index * 40}" 
                        font-size="30" 
                        fill="white" 
                        text-anchor="middle" 
                        dominant-baseline="middle"
                        font-family="Roboto, Arial, sans-serif"
                    >
                        ${escapeHtml(line.trim())}
                    </text>
                  `).join('')
                : ''
            }
        </svg>
    `;

    // 12. Generate the images by compositing each template with either the colored or white SVG
    try {
        if (!svgOverlay || typeof svgOverlay !== "string") {
            throw new Error("Invalid SVG data.");
        }

        await Promise.all(
            templatePaths.map((tplPath, i) => {
                // For demonstration, use the first overlay with user color, 
                // subsequent overlays with white text, similar to the bridging example
                const overlayToUse = i === 0 ? svgOverlay : svgOverlayWhite;

                return sharp(tplPath)
                    .composite([{ input: Buffer.from(overlayToUse), top: 0, left: 0 }])
                    .toFile(outputPaths[i]);
            })
        );

        console.log("Fish images generated successfully:", outputPaths);

        // 13. (Optional) Upload each image to Cloudinary and collect the URLs
        //     This mirrors how you do it in generateVisualFromQuote.
        const cloudinaryUrls = [];
        for (let i = 0; i < outputPaths.length; i++) {
            const url = await uploadImageToCloudinary(
                outputPaths[i], 
                userId, 
                version, 
                `fish-${i}`
            );
            cloudinaryUrls.push(url);
        }

        console.log("Images uploaded successfully:", cloudinaryUrls);

        // 14. Return final data, similar to the bridging function
        return [outputPaths, completion.choices[0].message, completion.model];

    } catch (error) {
        console.error("Error generating fish visual:", error);
        throw error;
    }
}


async function generateVisualFromQuoteNewton(options) {
    let {
        quote,
        theme,
        keyword,
        formality,
        color,
        style,
        isQuoteDisplayed,
        userId,
        version
    } = options;

    let isSummaryDisplayed = true;


    // Default color if nothing provided
    if (color === "") {
        color = "white";
    }

    console.log(`Processing quote: ${quote}, theme: ${theme}, formality: ${formality}, keyword: ${keyword},
        color: ${color}, style: ${style}, isQuoteDisplayed: ${isQuoteDisplayed}, isSummaryDisplayed: ${isSummaryDisplayed}`);

    // 1) Call OpenAI with Newton-specific instructions
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `
                    You are a web-based, AI-powered platform designed to transform quotes into visually engaging and easily understandable representations.

                    Task Instructions:
                    1. I will provide you with a quote, a theme, keyword, and a formality level.
                    2. Summarize the key concepts to align with the metaphorical meaning of the visual:
                       **Cause and effect, when one action or event directly leads to another outcome**.
                    3. Extract a single keyword that best represents the cause.
                    4. Create a 5-word summary using the keyword as the first word.

                    Guidelines:
                    - Ensure the five words convey the core essence of the original quote.
                    - The keyword must be the cause that leads to another outcome.
                    - The keyword must be the first word in the summary.
                    - Ensure the summary is grammatically correct and coherent.
                    - Consider the provided theme as context.
                    - Adjust the tone to match the requested formality level:
                      * Neutral: Balanced between formal and informal.
                      * Formal: Polished and professional.
                      * Informal: Casual, modern, and conversational.
                    
                    Example:
                    Quote: "You build your own momentum"
                    Keyword: momentum
                    5-word summary: "Momentum pushes forward your growth"
                    
                    Prioritize clarity, depth, and alignment with the theme and formality level. 
                    The result should be insightful and reflective of the original quote.
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

    // 2) Parse the JSON response from OpenAI
    const content = JSON.parse(completion.choices[0].message.content);
    const { insight } = content;
    console.log("Extracted insight:", insight);

    // 3) Define your template paths (similar to how bridging code does it).
    //    For illustration, we use two template images. Adjust as needed.
    const templatePaths = 
        [
            path.join('/workspaces/typescript-node-4/blueberry/backend/Sketch_200_Cradle-72dpi.png'),
            path.join('/workspaces/typescript-node-4/blueberry/backend/BlueP_200_Cradle-72dpi.png'),
            path.join('/workspaces/typescript-node-4/blueberry/backend/Min_B_200_Cradle-72dpi.png')
        ]

    // 4) Utility to escape any HTML characters in the text
    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // 5) Decide what text to display. You could show the original quote, 
    //    the new 5-word insight, or both. Here, let's just show the insight if isSummaryDisplayed is true,
    //    or the original quote if isQuoteDisplayed is true.
    let textToDisplay = "";
    if (isSummaryDisplayed) {
        textToDisplay = insight;
    } else if (isQuoteDisplayed) {
        textToDisplay = quote;
    }

    // Break the chosen text into lines for rendering
    // Adjust the max characters (25, 30, etc.) to fit your layout
    const lines = textToDisplay.match(/.{1,25}(\s|$)/g) || [];

    // 6) Create one SVG overlay for normal color text, another for white text (optional)
    //    If you want just one, you can skip the second overlay.
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
                    font-family="Pangolin"
                    font-weight="700"
                >
                    ${escapeHtml(line.trim())}
                </text>
            `).join("")}
        </svg>
    `;

    // Example of an alternative overlay if you want forced white text:
    const svgOverlayWhite = `
        <svg width="950" height="950" xmlns="http://www.w3.org/2000/svg">
            ${lines.map((line, index) => `
                <text
                    x="50%"
                    y="${200 + index * 60}"
                    font-size="44"
                    fill="white"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    font-family="Pangolin"
                    font-weight="700"
                >
                    ${escapeHtml(line.trim())}
                </text>
            `).join("")}
        </svg>
    `;

    try {
        if (!svgOverlay || typeof svgOverlay !== "string") {
            throw new Error("Invalid SVG data.");
        }

        // 7) Generate final images for each template path
        //    Following the same logic as the bridging code: 
        //    one variant might use the original color, the other might invert text color, etc.
        const outputPaths = templatePaths.map((_, i) =>
            path.join("/workspaces/typescript-node-4/blueberry/backend", `newtonoutput-${i}.png`)
        );

        await Promise.all(
            templatePaths.map((tplPath, i) => {
                if (i === 0) {
                    // For the first template, maybe we want black/darker text (if style is sketch).
                    // But you can adapt the condition to your style logic:
                    // e.g., if style === 'sketch', choose black text, else white, etc.
                    return sharp(tplPath)
                        .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
                        .toFile(outputPaths[i]);
                } else {
                    // For the second template, use white text overlay, or stick with the same.
                    return sharp(tplPath)
                        .composite([{ input: Buffer.from(svgOverlayWhite), top: 0, left: 0 }])
                        .toFile(outputPaths[i]);
                }
            })
        );

        console.log("Images generated successfully:", outputPaths);

        // 8) (Optional) Upload each image to Cloudinary if you want the same logic as the bridging code.
        //    This function assumes you have a helper like `uploadImageToCloudinary(filePath, userId, version, name)`.
        const cloudinaryUrls = [];
        for (let i = 0; i < outputPaths.length; i++) {
            const url = await uploadImageToCloudinary(
                outputPaths[i],
                userId,
                version,
                `newton-${i}`
            );
            cloudinaryUrls.push(url);
        }
        console.log("Images uploaded to Cloudinary successfully:", cloudinaryUrls);

        // 9) Return whatever final data you need:
        return [outputPaths, completion.choices[0].message, completion.model];
    } catch (error) {
        console.error("Error generating Newton-style visual:", error);
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

    // Parse the JSON content
    const content = JSON.parse(completion.choices[0].message.content);
    return content;
}



router.route('/').get((req, res) => {
  res.status(200).json({ message: 'Hello from DALL-E!' });
});

router.route('/').post(async (req, res) => {

    try {
        const { prompt, theme, color, formality, style, isQuoteDisplayed, isSummaryDisplayed, userId, version } = req.body;

        const options = {
            quote: prompt,
            theme: theme,
            formality: formality,
            color: color,
            style: style,
            isQuoteDisplayed: isQuoteDisplayed,
            isSummaryDisplayed: isSummaryDisplayed,
            userId: userId,
            version: version
        };
        
        console.log(`The body is: ${JSON.stringify(req.body)}`);

        const visualPromises = [
            generateVisualFromQuote(options),
            generateVisualFromQuoteBraid(options),
            generateVisualFromQuoteFish(options),
            generateVisualFromQuoteNewton(options)
        ];

        const results = await Promise.all(visualPromises);

        const [outputPath, textBridge, modelBridge] = results[0];
        const [outputPathBraid, textBraid, modelBraid] = results[1];
        const [fishOutputPath, textFish, modelFish] = results[2];
        const [newtonOutputPath, textNewton, modelNewton] = results[3];

        const imageBuffer = fs.readFileSync(outputPath[0]);
        const imageBase64 = imageBuffer.toString('base64');

        const imageBufferBraid = fs.readFileSync(outputPathBraid[0]);
        const imageBase64Braid = imageBufferBraid.toString('base64');

        const fishImageBuffer = fs.readFileSync(fishOutputPath[0]);
        const fishImageBase64 = fishImageBuffer.toString('base64');

        const newtonImageBuffer = fs.readFileSync(newtonOutputPath[0]);
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

    } catch (error) {
        console.error(error);
        res.status(500).send(error?.response.data.error.message || 'Something went wrong');
    }

});

router.route('/theme').post(async (req, res) => {
    try {
        const { prompt } = req.body;
    
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