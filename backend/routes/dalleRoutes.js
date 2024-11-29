import express from 'express';
import * as dotenv from 'dotenv';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

dotenv.config();

const router = express.Router();

import OpenAI from 'openai';
import { transform } from 'typescript';

const openai = new OpenAI();

// const openai = new OpenAIApi(configuration);

async function generateVisualFromQuote(quote, theme) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `
                    I'm building a tool called Blueberry AI, a web-based, AI-powered platform that transforms quotes into visually engaging and easily understandable representations.

                    I will provide you with a quote and a theme. Your task is to extract key concepts that align with A, B, and C, ensuring they reflect the visual’s metaphorical meaning within the context of the given theme (this is crucial). The theme should strongly influence how you interpret the quote and select the key words.

                    The metaphor is as follows: to move from A (Undesired Initial State) to B (Desired End State), one must build and rely on C (the foundation or bridge enabling the transition).

                    Guidelines:
                    Use the theme as the guiding lens to determine the most relevant and meaningful interpretations of A, B, and C.
                    Represent A, B, and C with a maximum of 2–3 words. If a single word doesn't suffice, you can use a compound phrase (e.g., "X and Y").
                    Ensure the chosen words clearly convey the essence of the visual when presented alone, without additional context.
                    Capitalize the first letter of each word in A, B, and C.
                    Reminder:
                    The theme is not just a backdrop but an integral part of your interpretation. The selected words must align with the theme and ensure the meaning of the visual resonates strongly within that framework.

                    Think deeply and choose terms that effectively encapsulate the quote, the metaphor, and the theme.
                `
            },
            {
                role: "user",
                content: quote
            },
            {
                role: "user",
                content: theme
            }

        ],
        // description: "The response should contain the key words that best match A, B, and C from the meaning of the visual. If the user was only presented with A, B, and C, they should be able to understand the meaning of the visual.", 
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "quote_analysis_schema",
                schema: {
                    type: "object",
                    properties: {
                        subpart1: {
                            // description: "Part A (The Initial State. Before Bridge.). Capitalize the first letter of each word.",
                            type: "string"
                        },
                        subpart2: {
                            // description: "Part B (Desired End State.) Capitalize the first letter of each word.",
                            type: "string"
                        },
                        subpart3: {
                            // description: "Part C (Bridge.) Capitalize the first letter of each word.",
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

    const subpart1 = content.subpart1;
    const subpart2 = content.subpart2;
    const subpart3 = content.subpart3;

    // Load the template image
    const templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/template.png');
    const outputPath = path.join('/workspaces/typescript-node-4/blueberry/backend/output.png');

    const lines = quote.match(/.{1,30}(\s|$)/g); // Split the quote into lines of max 30 characters
    // Create an SVG overlay with the text
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
            <text x="200" y="380" font-size="30" fill="white" text-anchor="middle" font-family="Roboto">${escapeHtml(subpart1)}</text>
            <text x="750" y="380" font-size="30" fill="white" text-anchor="middle" font-family="Roboto">${escapeHtml(subpart2)}</text>
            <text x="500" y="610" font-size="30" fill="white" text-anchor="middle" font-family="Roboto">${escapeHtml(subpart3)}</text>
            <text x="500" y="820" font-size="30" fill="white" text-anchor="middle" font-family="Roboto">Theme: ${theme}</text>
            ${lines.map((line, index) => `<text x="500" y="${870 + index * 30}" font-size="30" fill="white" text-anchor="middle" font-family="Roboto" font-weight="700">${escapeHtml(line.trim())}</text>`).join('')}
        </svg>
    `;
    try {
        // Validate the SVG data
        if (!svgOverlay || typeof svgOverlay !== 'string') {
          throw new Error('Invalid SVG data');
        }
    
        // Use sharp to composite the SVG overlay onto the template image
        await sharp(templatePath)
          .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
          .toFile(outputPath);
    
        console.log('Image generated successfully:', outputPath);
      } catch (error) {
        console.error('Error generating visual:', error);
        throw error;
      }

    return outputPath;
}

async function generateVisualFromQuoteBraid(prompt) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: "You are a tool designed to transform quotes into clear and concise visuals that enhance understanding and engagement. I will provide you with the meaning of a visual and a quote. Your task is to extract and distill the most relevant key words that align with the following framework:1)The metaphorical meaning of the visual is that three elements combine to produce a desired outcome.2)Each element should be captured in a maximum of two-three words (use 'and' if needed to connect concepts when a single word is insufficient).Your objective: Carefully analyze the meaning of the visual and the quote to identify and extract the most precise, meaningful, and concise key words that best represent:The first element,The second element,The third element. Outcome: The desired result or transformation these elements achieve when combined, keep the result to maximum two words. Think carefully, prioritize clarity, and ensure the key words encapsulate the essence of the quote and the visual's meaning. Capitilize the first letter of all words in A, B, and C. The quote is: " + prompt },
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "quote_analysis_schema",
                schema: {
                    type: "object",
                    properties: {
                        subpart1: {
                            // description: "The first subpart of the quote",
                            type: "string"
                        },
                        subpart2: {
                            // description: "The second subpart of the quote",
                            type: "string"
                        },
                        subpart3: {
                            // description: "The third subpart of the quote",
                            type: "string"
                        },
                        transformation: {
                            // description: "The desired result or transformation these subparts achieve when combined",
                            type: "string"
                        },
                        summary: {
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

    const subpart1 = content.subpart1;
    const subpart2 = content.subpart2;
    const subpart3 = content.subpart3;
    const summary = content.summary;
    const transformation = content.transformation;

    // Load the template image
    const templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/braid.png');
    const outputPath = path.join('/workspaces/typescript-node-4/blueberry/backend/braidoutput.png');

    // Create an SVG overlay with the text
    const svgOverlay = `
        <svg width="700" height="650" xmlns="http://www.w3.org/2000/svg">
        <text x="300" y="150" font-size="20" fill="black" font-family="Roboto" text-anchor="middle">${subpart1}</text>
        <text x="150" y="290" font-size="20" fill="black" font-family="Roboto" text-anchor="middle">${subpart2}</text>
        <text x="150" y="500" font-size="20" fill="black" font-family="Roboto" text-anchor="middle">${subpart3}</text>
        <text x="550" y="300" font-size="20" fill="black" font-family="Roboto" text-anchor="middle">${transformation}</text>
        <text y="620" font-size="20" fill="black" font-family="Roboto" text-anchor="middle">
            ${summary.split(' ').reduce((acc, word) => {
            const lastLine = acc[acc.length - 1];
            if (lastLine && (lastLine.length + word.length) < 60) {
                acc[acc.length - 1] = lastLine + ' ' + word;
            } else {
                acc.push(word);
            }
            return acc;
            }, []).map((line, index) => `<tspan x="350" dy="${index === 0 ? 0 : 25}" font-weight="700">${line.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</tspan>`).join('')}
        </text>
        </svg>
    `;
    // Use sharp to composite the SVG overlay onto the template image
    try {
        // Validate the SVG data
        if (!svgOverlay || typeof svgOverlay !== 'string') {
          throw new Error('Invalid SVG data');
        }
    
        // Use sharp to composite the SVG overlay onto the template image
        await sharp(templatePath)
          .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
          .toFile(outputPath);
    
        console.log('Image generated successfully:', outputPath);
      } catch (error) {
        console.error('Error generating visual:', error);
        throw error;
      }

    return outputPath;
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

async function generateVisualFromQuoteFish(prompt, color) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `
                    You are a specialized tool designed to transform quotes into clear, concise visuals that enhance understanding and engagement. I will provide you with the meaning of a visual and a quote. Your task is to: Extract the most relevant key concepts from the quote. Distill these concepts into a concise summary that can be read with a glance, ensuring alignment with the Metaphorical Meaning Visual: the tension and interplay between Individuality and conformity. Instructions: Prioritize clarity and relevance to ensure the summary encapsulates the quote's essence and align with the visual's intended meaning. The summary is no longer than 15 tokens. Think carefully about each concept.
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
    const templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/fish.png');
    const outputPath = path.join('/workspaces/typescript-node-4/blueberry/backend/fishoutput.png');

    // Split the quote into lines of max 30 characters
    const lines = insight.match(/.{1,30}(\s|$)/g);

    // Create an SVG overlay with the extracted text
    const svgOverlay = `
        <svg width="950" height="950" xmlns="http://www.w3.org/2000/svg">
            ${lines.map((line, index) => `
                <text x="500" y="${220 + index * 60}" font-size="44" fill="${color}" text-anchor="middle" font-family="Roboto" font-weight="700">
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

async function generateVisualFromQuoteNewton(prompt, color) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `
                    Imagine you are a monk teaching a student. Convert this quote into a five word quote, ensure it makes sense.
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
    const templatePath = path.join('/workspaces/typescript-node-4/blueberry/backend/newton.png');
    const outputPath = path.join('/workspaces/typescript-node-4/blueberry/backend/newtonoutput.png');

    // Split the quote into lines of max 30 characters
    const lines = insight.match(/.{1,40}(\s|$)/g);

    // Create an SVG overlay with the extracted text
    const svgOverlay = `
        <svg width="950" height="950" xmlns="http://www.w3.org/2000/svg">
            ${lines.map((line, index) => `
                <text x="500" y="${720 + index * 60}" font-size="20" fill="${color}" text-anchor="middle" font-family="Roboto" font-weight="700">
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
    const { prompt, theme } = req.body;
    console.log("a")
    console.log(prompt, theme);
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

    const outputPath = await generateVisualFromQuote(prompt, theme);
    const imageBuffer = fs.readFileSync(outputPath);
    const imageBase64 = imageBuffer.toString('base64');

    // const outputPathBraid = await generateVisualFromQuoteBraid(prompt);
    // const imageBufferBraid = fs.readFileSync(outputPathBraid);
    // const imageBase64Braid = imageBufferBraid.toString('base64');

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

    // const fishOutputPath = await generateVisualFromQuoteFish(prompt, "green");
    // const fishImageBuffer = fs.readFileSync(fishOutputPath);
    // const fishImageBase64 = fishImageBuffer.toString('base64');

    // const doorOutputPath = await generateVisualFromQuoteDoor(prompt, "url(#grad1)");
    // const doorImageBuffer = fs.readFileSync(doorOutputPath);
    // const doorImageBase64 = doorImageBuffer.toString('base64');

    // const newtonOutputPath = await generateVisualFromQuoteNewton(prompt, "rgb(123, 104, 238)");
    // const newtonImageBuffer = fs.readFileSync(newtonOutputPath);
    // const newtonImageBase64 = newtonImageBuffer.toString('base64');

    // Return the base64-encoded image in the response
    // res.status(200).json({ photo: imageBase64, braid: imageBase64Braid, iceberg: imageBase64Iceberg, insight: imageBase64Insight, hunt: huntImageBase64, tetris: tetrisImageBase64, fish: fishImageBase64, door: doorImageBase64, newton: newtonImageBase64 });
    res.status(200).json({ 
        photo: imageBase64, 
        braid: "", 
        iceberg: "", 
        insight: "", 
        hunt: "", 
        tetris: "", 
        fish: "", 
        door: "", 
        newton: "" 
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