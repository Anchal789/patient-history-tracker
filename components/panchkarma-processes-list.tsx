"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { SavedPanchkarmaProcess, PanchkarmaItem } from "@/lib/types"
import {
  getAllPanchkarmaProcesses,
  createPanchkarmaProcess,
  updatePanchkarmaProcess,
  deletePanchkarmaProcess,
} from "@/lib/realtime-database-service-panchkarma"

export function PanchkarmaProcessesList() {
  const [processes, setProcesses] = useState<SavedPanchkarmaProcess[]>([])
  const [filteredProcesses, setFilteredProcesses] = useState<SavedPanchkarmaProcess[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProcess, setEditingProcess] = useState<SavedPanchkarmaProcess | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [procedures, setProcedures] = useState<PanchkarmaItem[]>([{ procedureName: "", material: "", days: 0 }])

  useEffect(() => {
    fetchProcesses()
  }, [])

  useEffect(() => {
    const filtered = processes.filter(
      (process) =>
        process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.procedures.some(
          (p) =>
            p.procedureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.material.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    )
    setFilteredProcesses(filtered)
  }, [processes, searchTerm])

  const fetchProcesses = async () => {
    try {
      const data = await getAllPanchkarmaProcesses()
      setProcesses(data)
    } catch (error) {
      console.error("Error fetching Panchkarma processes:", error)
      toast({
        title: "Error",
        description: "Failed to load Panchkarma processes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (process?: SavedPanchkarmaProcess) => {
    if (process) {
      setEditingProcess(process)
      setName(process.name)
      setProcedures([...process.procedures])
    } else {
      setEditingProcess(null)
      setName("")
      setProcedures([{ procedureName: "", material: "", days: 0 }])
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProcess(null)
    setName("")
    setProcedures([{ procedureName: "", material: "", days: 0 }])
  }

  const handleAddProcedure = () => {
    setProcedures([...procedures, { procedureName: "", material: "", days: 0 }])
  }

  const handleRemoveProcedure = (index: number) => {
    if (procedures.length > 1) {
      setProcedures(procedures.filter((_, i) => i !== index))
    }
  }

  const handleProcedureChange = (index: number, field: keyof PanchkarmaItem, value: string | number) => {
    setProcedures(procedures.map((procedure, i) => (i === index ? { ...procedure, [field]: value } : procedure)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a process name",
        variant: "destructive",
      })
      return
    }

    const validProcedures = procedures.filter((p) => p.procedureName.trim() && p.material.trim() && p.days > 0)

    if (validProcedures.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one valid procedure",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const processData = {
        name: name.trim(),
        procedures: validProcedures,
      }

      if (editingProcess) {
        await updatePanchkarmaProcess(editingProcess.id, processData)
        toast({
          title: "Success",
          description: "Panchkarma process updated successfully",
        })
      } else {
        await createPanchkarmaProcess(processData)
        toast({
          title: "Success",
          description: "Panchkarma process created successfully",
        })
      }

      handleCloseDialog()
      fetchProcesses()
    } catch (error) {
      console.error("Error saving Panchkarma process:", error)
      toast({
        title: "Error",
        description: "Failed to save Panchkarma process",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Panchkarma process?")) {
      return
    }

    try {
      await deletePanchkarmaProcess(id)
      toast({
        title: "Success",
        description: "Panchkarma process deleted successfully",
      })
      fetchProcesses()
    } catch (error) {
      console.error("Error deleting Panchkarma process:", error)
      toast({
        title: "Error",
        description: "Failed to delete Panchkarma process",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search Panchkarma processes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Panchkarma Process
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingProcess ? "Edit Panchkarma Process" : "Add New Panchkarma Process"}</DialogTitle>
                <DialogDescription>
                  {editingProcess
                    ? "Update the Panchkarma process details"
                    : "Create a new Panchkarma process template"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Process Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter process name"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-lg">Procedures</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddProcedure}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Procedure
                    </Button>
                  </div>

                  {procedures.map((procedure, index) => (
                    <Card key={index} className="border border-muted">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Procedure {index + 1}</h4>
                          {procedures.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProcedure(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`procedure-${index}-name`}>Procedure Name *</Label>
                            <Input
                              id={`procedure-${index}-name`}
                              value={procedure.procedureName}
                              onChange={(e) => handleProcedureChange(index, "procedureName", e.target.value)}
                              placeholder="Enter procedure name"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`procedure-${index}-material`}>Material *</Label>
                            <Input
                              id={`procedure-${index}-material`}
                              value={procedure.material}
                              onChange={(e) => handleProcedureChange(index, "material", e.target.value)}
                              placeholder="Enter material"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`procedure-${index}-days`}>Days *</Label>
                            <Input
                              id={`procedure-${index}-days`}
                              type="number"
                              min="1"
                              value={procedure.days}
                              onChange={(e) =>
                                handleProcedureChange(index, "days", Number.parseInt(e.target.value) || 0)
                              }
                              placeholder="Enter number of days"
                              required
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingProcess ? "Updating..." : "Creating..."}
                    </>
                  ) : editingProcess ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProcesses.map((process) => (
          <Card key={process.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{process.name}</CardTitle>
                  <CardDescription>
                    {process.procedures.length} procedure{process.procedures.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(process)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(process.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {process.procedures.slice(0, 3).map((procedure, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">
                      {index + 1}. {procedure.procedureName}
                    </span>
                    <div className="text-muted-foreground">
                      {procedure.material} - {procedure.days} days
                    </div>
                  </div>
                ))}
                {process.procedures.length > 3 && (
                  <div className="text-sm text-muted-foreground">+{process.procedures.length - 3} more procedures</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProcesses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm ? "No Panchkarma processes found matching your search." : "No Panchkarma processes found."}
          </p>
        </div>
      )}
    </div>
  )
}
