"use client"

import { useEffect, useRef, useState } from "react"
import { ItemConfigurationTable } from "@/components/item-configuration-table"
import {
  itemConfigurationService,
  type ItemConfiguration,
  type LookupOption,
} from "@/lib/services/itemConfigurationService"

type ItemConfigurationFormData = {
  itemTypeId: string
  processorId: string
  specification: string
  configurationText: string
  isActive: boolean
}

export function ItemConfigurationPage() {
  const [data, setData] = useState<ItemConfiguration[]>([])
  const [itemTypes, setItemTypes] = useState<LookupOption[]>([])
  const [processors, setProcessors] = useState<LookupOption[]>([])
  const [loading, setLoading] = useState(false)
  const isLoadingRef = useRef(false)
  const hasLoadedRef = useRef(false)

  const loadData = async () => {
    if (isLoadingRef.current) return

    try {
      isLoadingRef.current = true
      setLoading(true)

      const [configurations, itemTypeOptions, processorOptions] = await Promise.all([
        itemConfigurationService.getAll(),
        itemConfigurationService.getItemTypes(),
        itemConfigurationService.getProcessors(),
      ])

      setData(configurations)
      setItemTypes(itemTypeOptions)
      setProcessors(processorOptions)
      hasLoadedRef.current = true
    } catch (error) {
      console.error("Error loading item configurations:", error)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadData()
    }
  }, [])

  const handleAdd = async (payload: ItemConfigurationFormData) => {
    const created = await itemConfigurationService.create(payload)
    setData((prev) => [created, ...prev])
  }

  const handleEdit = async (id: string, payload: ItemConfigurationFormData) => {
    const updated = await itemConfigurationService.update(id, { id, ...payload })
    setData((prev) => prev.map((item) => (item.id === id ? updated : item)))
  }

  const handleDelete = async (id: string) => {
    await itemConfigurationService.delete(id)
    setData((prev) => prev.filter((item) => item.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading Item Configurations...</div>
      </div>
    )
  }

  return (
    <ItemConfigurationTable
      data={data}
      itemTypes={itemTypes}
      processors={processors}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  )
}
