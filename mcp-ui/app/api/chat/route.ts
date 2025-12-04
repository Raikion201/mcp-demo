import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || '',
});

// Define the MCP tools for function calling
const mcpToolDefinitions: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'todo_ui',
      description: 'Display the interactive Todo application UI. Call this when user wants to see their todos or manage tasks visually.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'todo_create',
      description: 'Create a new todo item. Use this when user wants to add a new task.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'The title of the todo item',
          },
          description: {
            type: 'string',
            description: 'Optional description for the todo',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'todo_list',
      description: 'List all todos. Use this when user asks to see their tasks or todo list.',
      parameters: {
        type: 'object',
        properties: {
          completed: {
            type: 'boolean',
            description: 'Filter by completion status',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'todo_update',
      description: 'Update a todo item. Use this when user wants to modify, complete, or edit a task.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the todo to update',
          },
          title: {
            type: 'string',
            description: 'New title for the todo',
          },
          description: {
            type: 'string',
            description: 'New description for the todo',
          },
          completed: {
            type: 'boolean',
            description: 'Mark todo as completed or not',
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'todo_delete',
      description: 'Delete a todo item. Use this when user wants to remove a task.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the todo to delete',
          },
        },
        required: ['id'],
      },
    },
  },
];

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful todo management assistant. You can help users create, view, update, and delete their todos using the available tools. When a user wants to see their todos or interact with them, use the todo_ui tool to show them an interactive interface. Be concise and helpful.',
        },
        ...messages,
      ],
      tools: mcpToolDefinitions,
      tool_choice: 'auto',
    });

    return NextResponse.json(response.choices[0].message);
  } catch (error: any) {
    console.error('DeepSeek API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to call DeepSeek API' },
      { status: 500 }
    );
  }
}

