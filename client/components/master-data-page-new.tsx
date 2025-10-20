"use client"

import { MasterDataRouter } from "./master-data/MasterDataRouter"

interface MasterDataPageProps {
  category: string
}

export function MasterDataPage({ category }: MasterDataPageProps) {
  return <MasterDataRouter category={category} />
}
