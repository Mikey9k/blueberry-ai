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
                      - Informal: Casual, modern language.
                    
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
        <text x="200" y="${380 + yOffset}" font-size="30" fill="${color}" text-anchor="middle" font-family="Roboto">${escapeHtml(subpart1)}</text>
        <text x="750" y="${380 + yOffset}" font-size="30" fill="${color}" text-anchor="middle" font-family="Roboto">${escapeHtml(subpart2)}</text>
        <text x="500" y="${610 + yOffset}" font-size="30" fill="${color}" text-anchor="middle" font-family="Roboto">${escapeHtml(subpart3)}</text>
        <text x="500" y="${820 + yOffset}" font-size="30" fill="${color}" text-anchor="middle" font-family="Roboto">Theme: ${theme}</text>
        ${lines.map((line, index) => `<text x="500" y="${870 + index * 30 + yOffset}" font-size="30" fill="${color}" text-anchor="middle" font-family="Roboto" font-weight="700">${escapeHtml(line.trim())}</text>`).join('')}
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

async function generateVisualFromQuoteBraid(quote, theme, formality, color = "black") {
    if (color === "") {
        color = "black";
    }
    // if (!quote || !theme || !formality) {
    //     throw new Error("Quote, theme, and formality are required parameters.");
    // }

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
                    - Adjust your word choices to align with the formality level (neutral, formal, or informal).
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

    const templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/braid.png');
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
        <svg width="700" height="650" xmlns="http://www.w3.org/2000/svg">
            <text x="300" y="150" font-size="20" fill="${color}" font-family="Roboto" text-anchor="middle">${escapeHtml(subpart1)}</text>
            <text x="150" y="290" font-size="20" fill="${color}" font-family="Roboto" text-anchor="middle">${escapeHtml(subpart2)}</text>
            <text x="150" y="500" font-size="20" fill="${color}" font-family="Roboto" text-anchor="middle">${escapeHtml(subpart3)}</text>
            <text x="550" y="300" font-size="20" fill="${color}" font-family="Roboto" text-anchor="middle">${escapeHtml(transformation)}</text>
            <text y="620" font-size="20" fill="${color}" font-family="Roboto" text-anchor="middle">
                ${summary.split(' ').reduce((acc, word) => {
                    const lastLine = acc[acc.length - 1];
                    if (lastLine && (lastLine.length + word.length) < 60) {
                        acc[acc.length - 1] = lastLine + ' ' + word;
                    } else {
                        acc.push(word);
                    }
                    return acc;
                }, []).map((line, index) => `<tspan x="350" dy="${index === 0 ? 0 : 25}" font-weight="700">${escapeHtml(line.trim())}</tspan>`).join('')}
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

async function generateVisualFromQuoteIceberg(prompt) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `
                    You are Blueberry AI, a tool that transforms quotes into visually engaging and meaningful representations.
                    The attached visual represents an iceberg, where:
                    - "Above the Surface" (Visible) symbolizes superficial aspects or outcomes.
                    - "Below the Surface" (Hidden) symbolizes foundational or deeper factors contributing to the outcome.
                    Your task is to analyze the provided quote and meaning to extract:
                    1. The **Visible Aspect** ("Above the Surface").
                    2. The **Hidden Factors** ("Below the Surface").
                    3. The **Overall Insight** connecting the visible and hidden aspects.
                    Ensure the keywords are concise (1-3 words), capitalized, and align with the iceberg metaphor.
                    The response must contain the key terms for:
                    - Visible Aspect
                    - Hidden Factors
                    - Overall Insight
                    Alongside the original quote for reference.
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
                        visibleAspect: {
                            // description: "Part A (The Initial State. Before Bridge.). Capitalize the first letter of each word.",
                            type: "string"
                        },
                        hiddenFactors: {
                            // description: "Part B (Desired End State.) Capitalize the first letter of each word.",
                            type: "string"
                        },
                        overallInsight: {
                            // description: "Part C (Bridge.) Capitalize the first letter of each word.",
                            type: "string"
                        },
                        quote: {
                            description: "The quote given.",
                            type: "string"
                        }
                    },
                    additionalProperties: false
                }
            }
        }
    });

    console.log(completion.choices[0].message);

    // Parse the JSON content
    const content = JSON.parse(completion.choices[0].message.content);

    const visibleAspect = content.visibleAspect;
    const hiddenFactors = content.hiddenFactors;
    const overallInsight = content.overallInsight;
    const quote = content.quote;

    // Load the template image
    const templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/iceberg.png');
    const outputPath = path.join('/workspaces/typescript-node-4/blueberry/backend/icebergoutput.png');

    // Create an SVG overlay with the extracted text
    const lines = quote.match(/.{1,30}(\s|$)/g); // Split the quote into lines of max 30 characters
    const svgOverlay = `
        <svg width="450" height="450" xmlns="http://www.w3.org/2000/svg">
        <text x="250" y="100" font-size="10" fill="black" text-anchor="middle" font-family="Roboto">${visibleAspect}</text>
        <text x="250" y="200" font-size="15" fill="black" text-anchor="middle" font-weight="700" font-family="Roboto">${hiddenFactors}</text>
        ${lines.map((line, index) => `
            <text x="245" y="${390 + index * 20}" font-size="14" fill="white" text-anchor="middle" font-family="Roboto" font-weight="700">
                ${line.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </text>
        `).join('')}        
        </svg>
    `;

    try {
        // Validate the SVG data
        if (!svgOverlay || typeof svgOverlay !== 'string') {
            throw new Error("Invalid SVG data");
        }

        // Use sharp to composite the SVG overlay onto the template image
        await sharp(templatePath)
            .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
            .toFile(outputPath);

        console.log("Image generated successfully:", outputPath);
    } catch (error) {
        console.error("Error generating iceberg visual:", error);
        throw error;
    }

    return outputPath;
}

async function generateVisualFromQuoteInsight(prompt) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `
                    You are Blueberry AI, a tool that transforms quotes into visually engaging and meaningful representations.
                    Transform this quote into a concise, impactful insight. Maximum 6 words. Masculine motivation.
                    Alongside the original quote for reference.
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
                        insight: {
                            // description: "Part A (The Initial State. Before Bridge.). Capitalize the first letter of each word.",
                            type: "string"
                        },
                        quote: {
                            description: "The quote given.",
                            type: "string"
                        }
                    },
                    additionalProperties: false
                }
            }
        }
    });

    console.log(completion.choices[0].message);

    // Parse the JSON content
    const content = JSON.parse(completion.choices[0].message.content);

    const insight = content.insight;

    // Load the template image
    const templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/insight.png');
    const outputPath = path.join('/workspaces/typescript-node-4/blueberry/backend/insightoutput.png');

    // Create an SVG overlay with the extracted text
    // const lines = quote.match(/.{1,30}(\s|$)/g); // Split the quote into lines of max 30 characters
    const svgOverlay = `
        <svg width="450" height="450" xmlns="http://www.w3.org/2000/svg">
        <text x="250" y="400" font-size="15" fill="white" text-anchor="middle" font-weight="700" font-family="Roboto">${insight}</text>     
        </svg>
    `;

    try {
        // Validate the SVG data
        if (!svgOverlay || typeof svgOverlay !== 'string') {
            throw new Error("Invalid SVG data");
        }

        // Use sharp to composite the SVG overlay onto the template image
        await sharp(templatePath)
            .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
            .toFile(outputPath);

        console.log("Image generated successfully:", outputPath);
    } catch (error) {
        console.error("Error generating insight visual:", error);
        throw error;
    }

    return outputPath;
}

async function generateVisualFromQuoteHunt(prompt, color) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `
                    You are Blueberry AI, a tool that transforms quotes into visually engaging and meaningful representations.
                    Transform this quote into a short, impactful quote that inspires teamwork, personal growth, and collective transformation.
                    Speak to a group."
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
                        insight: {
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

    const insight = content.insight;

    // Load the template image
    const templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/hunt.png');
    const outputPath = path.join('/workspaces/typescript-node-4/blueberry/backend/huntoutput.png');

    // Split the quote into lines of max 30 characters
    const lines = insight.match(/.{1,30}(\s|$)/g);

    // Create an SVG overlay with the extracted text
    const svgOverlay = `
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            ${lines.map((line, index) => `
                <text x="215" y="${320 + index * 20}" font-size="14" fill="${color}" text-anchor="middle" font-family="Roboto" font-weight="700">
                    ${line.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </text>
            `).join('')}    
        </svg>
    `;

    try {
        // Validate the SVG data
        if (!svgOverlay || typeof svgOverlay !== 'string') {
            throw new Error("Invalid SVG data");
        }

        // Use sharp to composite the SVG overlay onto the template image
        await sharp(templatePath)
            .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
            .toFile(outputPath);

        console.log("Image generated successfully:", outputPath);
    } catch (error) {
        console.error("Error generating insight visual:", error);
        throw error;
    }

    return outputPath;
}

async function generateVisualFromQuoteTetris(prompt, color) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `
                    You are a specialized tool designed to transform quotes into clear, concise visuals that enhance understanding and engagement. I will provide you with the meaning of a visual and a quote. Your task is to: Extract the most relevant key concepts from the quote. Distill these concepts into a concise summary that can be read with a glance, ensuring alignment with the Metaphorical Meaning Visual:reflects how, in life, we must adapt to changing circumstances and challenges, finding the best "fit" for our actions or decisions within a larger system. Instructions: Prioritize clarity and relevance to ensure the summary encapsulates the quote's essence and align with the visual's intended meaning. The summary is no longer than 15 tokens. Think carefully about each concept.
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
                        insight: {
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

    const insight = content.insight;

    // Load the template image
    const templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/tetris.png');
    const outputPath = path.join('/workspaces/typescript-node-4/blueberry/backend/tetrisoutput.png');

    // Split the quote into lines of max 30 characters
    const lines = insight.match(/.{1,30}(\s|$)/g);

    // Create an SVG overlay with the extracted text
    const svgOverlay = `
        <svg width="950" height="950" xmlns="http://www.w3.org/2000/svg">
            ${lines.map((line, index) => `
                <text x="500" y="${720 + index * 60}" font-size="44" fill="${color}" text-anchor="middle" font-family="Roboto" font-weight="700">
                    ${line.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </text>
            `).join('')}    
        </svg>
    `;

    try {
        // Validate the SVG data
        if (!svgOverlay || typeof svgOverlay !== 'string') {
            throw new Error("Invalid SVG data");
        }

        // Use sharp to composite the SVG overlay onto the template image
        await sharp(templatePath)
            .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
            .toFile(outputPath);

        console.log("Image generated successfully:", outputPath);
    } catch (error) {
        console.error("Error generating insight visual:", error);
        throw error;
    }

    return outputPath;
}

async function generateVisualFromQuoteFish(quote, theme, formality, color = "white") {
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

    const templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/fish.png');
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
    const lines = insight.match(/.{1,30}(\s|$)/g);

    // Create an SVG overlay with the extracted text
    const svgOverlay = `
        <svg width="950" height="950" xmlns="http://www.w3.org/2000/svg">
            ${lines.map((line, index) => `
                <text x="475" y="${220 + index * 60}" font-size="44" fill="${color}" text-anchor="middle" font-family="Roboto" font-weight="700">
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


async function generateVisualFromQuoteDoor(prompt, color) {

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `
                    You are a specialized tool designed to transform quotes into clear, concise visuals that enhance understanding and engagement. I will provide you with the meaning of a visual and a quote. Your task is to: Extract the most relevant key concepts from the quote. Distill these concepts into a concise summary that can be read with a glance, ensuring alignment with the Metaphorical Meaning Visual: the classic metaphor of life's crossroads, where one is faced with choices, highlight the importance of decision-making, suggesting that life often presents multiple opportunities or paths to take. Instructions: Prioritize clarity and relevance to ensure the summary encapsulates the quote's essence and align with the visual's intended meaning. The summary is no longer than 15 tokens. Think carefully about each concept.
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
                        insight: {
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

    const insight = content.insight;

    // Load the template image
    const templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/door.png');
    const outputPath = path.join('/workspaces/typescript-node-4/blueberry/backend/dooroutput.png');

    // Split the quote into lines of max 30 characters
    const lines = insight.match(/.{1,30}(\s|$)/g);

    // Create an SVG overlay with the extracted text
    const svgOverlay = `
        <svg width="950" height="950" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
                </linearGradient>
            </defs>
            ${lines.map((line, index) => `
                <text x="500" y="${720 + index * 60}" font-size="44" fill="${color}" text-anchor="middle" font-family="Roboto" font-weight="700">
                    ${line.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </text>
            `).join('')}    
        </svg>
    `;

    try {
        // Validate the SVG data
        if (!svgOverlay || typeof svgOverlay !== 'string') {
            throw new Error("Invalid SVG data");
        }

        // Use sharp to composite the SVG overlay onto the template image
        await sharp(templatePath)
            .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
            .toFile(outputPath);

        console.log("Image generated successfully:", outputPath);
    } catch (error) {
        console.error("Error generating insight visual:", error);
        throw error;
    }

    return outputPath;
}

async function generateVisualFromQuoteNewton(quote, theme, formality, color = "white") {
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
                    Imagine you are a wise monk teaching a student. Your task is to transform the provided quote into a concise and meaningful five-word statement. 

                    Guidelines:
                    - Ensure the five words convey the core essence of the original quote.
                    - Consider the provided theme as context to guide your interpretation.
                    - Adjust the tone of the statement to match the requested formality level:
                        - **Neutral**: Balanced between formal and informal.
                        - **Formal**: Polished and professional.
                        - **Informal**: Casual, modern, and conversational.

                    Prioritize clarity, depth, and alignment with the theme and formality level. The result should be insightful and reflective of the original quote.
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

    const templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/newton.png');
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
    const lines = insight.match(/.{1,40}(\s|$)/g);

    const svgOverlay = `
        <svg width="950" height="950" xmlns="http://www.w3.org/2000/svg">
            ${lines.map((line, index) => `
                <text x="475" y="${220 + index * 60}" font-size="44" fill="${color}" text-anchor="middle" font-family="Roboto" font-weight="700">
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
    console.log("a")
    console.log(prompt, theme, color, formality, style);
    console.log("a")


    // const completion = await openai.chat.completions.create({
    //     model: "gpt-4o",
    //     messages: [
    //         { role: "system", content: "You are a helpful assistant." },
    //         {
    //             role: "user",
    //             content: "Write a haiku about recursion in programming.",
    //         },
    //     ],
    // });
    
    // console.log(completion.choices[0].message);

    const [outputPath, textBridge, modelBridge]  = await generateVisualFromQuote(prompt, theme, formality, color, style);
    const imageBuffer = fs.readFileSync(outputPath);
    const imageBase64 = imageBuffer.toString('base64');

    const [outputPathBraid, textBraid, modelBraid ] = await generateVisualFromQuoteBraid(prompt, theme, formality, color);
    const imageBufferBraid = fs.readFileSync(outputPathBraid);
    const imageBase64Braid = imageBufferBraid.toString('base64');

    // const outputPathIceberg = await generateVisualFromQuoteIceberg(prompt);
    // const imageBufferIceberg = fs.readFileSync(outputPathIceberg);
    // const imageBase64Iceberg = imageBufferIceberg.toString('base64');

    // const outputPathInsight = await generateVisualFromQuoteInsight(prompt);
    // const imageBufferInsight = fs.readFileSync(outputPathInsight);
    // const imageBase64Insight = imageBufferInsight.toString('base64');

    // const huntOutputPath = await generateVisualFromQuoteHunt(prompt, "red");
    // const huntImageBuffer = fs.readFileSync(huntOutputPath);
    // const huntImageBase64 = huntImageBuffer.toString('base64');

    // const tetrisOutputPath = await generateVisualFromQuoteTetris(prompt, "blue");
    // const tetrisImageBuffer = fs.readFileSync(tetrisOutputPath);
    // const tetrisImageBase64 = tetrisImageBuffer.toString('base64');


    // let fishOutputPath;
    // if (color !== '') {
    //     fishOutputPath = await generateVisualFromQuoteFish(prompt, color);
    // } else {
    //     fishOutputPath = await generateVisualFromQuoteFish(prompt, "green");
    // }

    const [fishOutputPath, textFish, modelFish] = await generateVisualFromQuoteFish(prompt, theme, formality, color);
    const fishImageBuffer = fs.readFileSync(fishOutputPath);
    const fishImageBase64 = fishImageBuffer.toString('base64');

    // const doorOutputPath = await generateVisualFromQuoteDoor(prompt, "url(#grad1)");
    // const doorImageBuffer = fs.readFileSync(doorOutputPath);
    // const doorImageBase64 = doorImageBuffer.toString('base64');

    const [newtonOutputPath, textNewton, modelNewton] = await generateVisualFromQuoteNewton(prompt, theme, formality, color);
    const newtonImageBuffer = fs.readFileSync(newtonOutputPath);
    const newtonImageBase64 = newtonImageBuffer.toString('base64');

    // Return the base64-encoded image in the response
    // res.status(200).json({ photo: imageBase64, braid: imageBase64Braid, iceberg: imageBase64Iceberg, insight: imageBase64Insight, hunt: huntImageBase64, tetris: tetrisImageBase64, fish: fishImageBase64, door: doorImageBase64, newton: newtonImageBase64 });
    res.status(200).json({ 
        photo: imageBase64, 
        braid: imageBase64Braid, 
        iceberg: "", 
        insight: "", 
        hunt: "", 
        tetris: "", 
        fish: fishImageBase64, 
        door: "", 
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