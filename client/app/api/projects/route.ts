import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/services/projectService'

export async function GET() {
  try {
    const projects = await ProjectService.getAll()
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const project = await ProjectService.create(body)
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 400 }
    )
  }
}
