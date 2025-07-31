"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import type { ChiefComplaint } from "@/lib/types"
import {
  getAllChiefComplaints,
  createChiefComplaint,
  updateChiefComplaint,
  deleteChiefComplaint,
} from "@/lib/realtime-database-service-chief-complaints"

export function ChiefComplaintsList() {
  const [complaints, setComplaints] = useState<ChiefComplaint[]>([])
  const [filteredComplaints, setFilteredComplaints] = useState<ChiefComplaint[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingComplaint, setEditingComplaint] = useState<ChiefComplaint | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [complaint, setComplaint] = useState("")

  useEffect(() => {
    fetchComplaints()
  }, [])

  useEffect(() => {
    const filtered = complaints.filter(
      (complaint) =>
        complaint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.complaint.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredComplaints(filtered)
  }, [complaints, searchTerm])

  const fetchComplaints = async () => {
    try {
      const data = await getAllChiefComplaints()
      setComplaints(data)
    } catch (error) {
      console.error("Error fetching chief complaints:", error)
      toast({
        title: "Error",
        description: "Failed to load chief complaints",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (complaint?: ChiefComplaint) => {
    if (complaint) {
      setEditingComplaint(complaint)
      setName(complaint.name)
      setComplaint(complaint.complaint)
    } else {
      setEditingComplaint(null)
      setName("")
      setComplaint("")
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingComplaint(null)
    setName("")
    setComplaint("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !complaint.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (complaint.length > 1000) {
      toast({
        title: "Error",
        description: "Chief complaint cannot exceed 1000 characters",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const complaintData = {
        name: name.trim(),
        complaint: complaint.trim(),
      }

      if (editingComplaint) {
        await updateChiefComplaint(editingComplaint.id, complaintData)
        toast({
          title: "Success",
          description: "Chief complaint updated successfully",
        })
      } else {
        await createChiefComplaint(complaintData)
        toast({
          title: "Success",
          description: "Chief complaint created successfully",
        })
      }

      handleCloseDialog()
      fetchComplaints()
    } catch (error) {
      console.error("Error saving chief complaint:", error)
      toast({
        title: "Error",
        description: "Failed to save chief complaint",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this chief complaint?")) {
      return
    }

    try {
      await deleteChiefComplaint(id)
      toast({
        title: "Success",
        description: "Chief complaint deleted successfully",
      })
      fetchComplaints()
    } catch (error) {
      console.error("Error deleting chief complaint:", error)
      toast({
        title: "Error",
        description: "Failed to delete chief complaint",
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
            placeholder="Search chief complaints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Chief Complaint
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingComplaint ? "Edit Chief Complaint" : "Add New Chief Complaint"}</DialogTitle>
                <DialogDescription>
                  {editingComplaint ? "Update the chief complaint details" : "Create a new chief complaint template"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter complaint name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complaint">Chief Complaint *</Label>
                  <Textarea
                    id="complaint"
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    placeholder="Enter chief complaint details"
                    rows={6}
                    maxLength={1000}
                    required
                  />
                  <p className="text-sm text-muted-foreground">{complaint.length}/1000 characters</p>
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
                      {editingComplaint ? "Updating..." : "Creating..."}
                    </>
                  ) : editingComplaint ? (
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
        {filteredComplaints.map((complaint) => (
          <Card key={complaint.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{complaint.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(complaint)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(complaint.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-3">{complaint.complaint}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredComplaints.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm ? "No chief complaints found matching your search." : "No chief complaints found."}
          </p>
        </div>
      )}
    </div>
  )
}
