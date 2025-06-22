import { NextResponse } from 'next/server'
import dbConnect from '@/config/database'
import Todo from '@/models/todo'
import { z } from 'zod'

// Zod schema for Todo creation and update
const todoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  user: z.string().min(1, 'User ID is required'),
})

const todoUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  completed: z.boolean()
})

export async function GET(request) {
  await dbConnect()

  const todos = await Todo.find().sort({ createdAt: -1 })
  return NextResponse.json(todos)
}

export async function POST(request) {
  await dbConnect()

  let body
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = todoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const todo = await Todo.create(parsed.data)
  return NextResponse.json(todo, { status: 201 })
}


export async function PATCH(request) {
  await dbConnect()

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ message: 'Todo ID is required' }, { status: 400 })
  }

  let body
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = todoUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const updatedTodo = await Todo.findByIdAndUpdate(id, parsed.data, { new: true })

  if (!updatedTodo) {
    return NextResponse.json({ message: 'Todo not found' }, { status: 404 })
  }

  return NextResponse.json(updatedTodo)
}


export async function DELETE(request) {
  await dbConnect()

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ message: 'Todo ID is required' }, { status: 400 })
  }

  const deletedTodo = await Todo.findByIdAndDelete(id)

  if (!deletedTodo) {
    return NextResponse.json({ message: 'Todo not found' }, { status: 404 })
  }

  return NextResponse.json({ message: 'Todo deleted successfully' })
}
