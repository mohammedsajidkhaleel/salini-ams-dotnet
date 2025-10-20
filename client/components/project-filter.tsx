"use client"

import { useState, useEffect, useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context-new"
import { ProjectService } from "@/lib/services"

interface Project {
  id: string
  name: string
  code: string
}

interface ProjectFilterProps {
  selectedProjectId: string
  onProjectChange: (projectId: string) => void
  showAllOption?: boolean
  className?: string
}

export function ProjectFilter({ 
  selectedProjectId, 
  onProjectChange, 
  showAllOption = true,
  className = ""
}: ProjectFilterProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (user && !hasLoaded.current) {
      hasLoaded.current = true
      loadProjects()
    }
  }, [user?.id, user?.projectIds]) // Reload when user ID or project assignments change

  const loadProjects = async () => {
    try {
      setLoading(true)
      
      // Get projects from API - filtering is now handled server-side
      const projects = await ProjectService.getAll();
      
      console.log('📋 ProjectFilter - Loaded projects from API:', {
        userId: user?.id,
        userRole: user?.role,
        totalProjects: projects.length,
        projectNames: projects.map(p => p.name)
      });
      
      setProjects(projects)
    } catch (error) {
      console.error('Error loading projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>Project</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading projects..." />
          </SelectTrigger>
        </Select>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>Project</Label>
      <Select value={selectedProjectId} onValueChange={onProjectChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">All Projects</SelectItem>
          )}
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name} ({project.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

