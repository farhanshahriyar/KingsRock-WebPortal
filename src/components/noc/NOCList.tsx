
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { useRole } from "@/contexts/RoleContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type NOCStatus = 'pending' | 'approved' | 'rejected';

interface NOCRequest {
  id: string;
  reason: string;
  message: string;
  requested_days: string[];
  status: NOCStatus;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

const NOCList = () => {
  const [selectedNOC, setSelectedNOC] = useState<NOCRequest | null>(null);
  const [editReason, setEditReason] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editDays, setEditDays] = useState<Date[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const { role } = useRole();
  const queryClient = useQueryClient();

  // Query to fetch NOC requests
  const { data: nocs = [], isLoading, error } = useQuery({
    queryKey: ['noc-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('noc_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Validate and convert the status to NOCStatus type
      return (data || []).map(noc => ({
        ...noc,
        status: noc.status as NOCStatus // Type assertion since we know the database constrains these values
      }));
    },
  });

  // Handle error from query
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load NOC requests: " + (error as Error).message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting NOC with ID:", id);
      
      // Perform the delete operation
      const { error } = await supabase
        .from('noc_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Delete error:", error);
        throw new Error(error.message);
      }
      
      return id;
    },
    onSuccess: (deletedId) => {
      console.log("Successfully deleted NOC with ID:", deletedId);
      setIsDeleteAlertOpen(false); // Close the dialog after successful deletion
      
      toast({
        title: "Success",
        description: "NOC request deleted successfully",
      });
      
      // Invalidate and refetch the data
      queryClient.invalidateQueries({ queryKey: ['noc-requests'] });
    },
    onError: (error) => {
      console.error("Delete mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to delete NOC request: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (nocData: {
      id: string;
      reason: string;
      message: string;
      requested_days: string[];
    }) => {
      const { error } = await supabase
        .from('noc_requests')
        .update({
          reason: nocData.reason,
          message: nocData.message,
          requested_days: nocData.requested_days,
        })
        .eq('id', nocData.id);

      if (error) throw new Error(error.message);
      return nocData;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "NOC request updated successfully",
      });
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['noc-requests'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update NOC request: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: NOCStatus }) => {
      const { error } = await supabase
        .from('noc_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw new Error(error.message);
      return { id, status };
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
      
      // Update the selected NOC locally to avoid refetching
      if (selectedNOC && selectedNOC.id === data.id) {
        setSelectedNOC({
          ...selectedNOC,
          status: data.status
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['noc-requests'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update status: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (noc: NOCRequest) => {
    setSelectedNOC(noc);
    setEditReason(noc.reason);
    setEditMessage(noc.message || "");
    setEditDays(noc.requested_days.map(day => new Date(day)));
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    console.log("Setting delete ID:", id);
    setDeleteId(id);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      console.log("Confirming delete for ID:", deleteId);
      deleteMutation.mutate(deleteId);
      // Alert dialog will be closed in onSuccess callback
    } else {
      console.error("No delete ID set");
      toast({
        title: "Error",
        description: "No item selected for deletion",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = () => {
    if (!selectedNOC) return;

    updateMutation.mutate({
      id: selectedNOC.id,
      reason: editReason,
      message: editMessage,
      requested_days: editDays.map(date => date.toISOString().split('T')[0]),
    });
  };

  const getStatusBadge = (status: NOCStatus) => {
    const variants = {
      pending: {
        className: "bg-[#FEF7CD] text-yellow-800 hover:bg-[#FEF7CD]/80",
        variant: "secondary"
      },
      approved: {
        className: "bg-[#F2FCE2] text-green-800 hover:bg-[#F2FCE2]/80",
        variant: "secondary"
      },
      rejected: {
        className: "bg-[#ea384c] text-white hover:bg-[#ea384c]/80",
        variant: "secondary"
      },
    } as const;

    return (
      <Badge 
        variant={variants[status].variant}
        className={variants[status].className}
      >
        {status}
      </Badge>
    );
  };

  const calculateNOCDays = (days: string[]) => {
    return `${days.length} days`;
  };

  // Set up real-time subscription for NOC request updates
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'noc_requests'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          queryClient.invalidateQueries({ queryKey: ['noc-requests'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your NOC Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your NOC Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>NOC Reason</TableHead>
                <TableHead>NOC Message</TableHead>
                <TableHead>NOC Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    No NOC requests found
                  </TableCell>
                </TableRow>
              ) : (
                nocs.map((noc, index) => (
                  <TableRow key={noc.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{noc.reason}</TableCell>
                    <TableCell>{noc.message}</TableCell>
                    <TableCell>{calculateNOCDays(noc.requested_days)}</TableCell>
                    <TableCell>{getStatusBadge(noc.status)}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(noc)}
                        disabled={deleteMutation.isPending || updateMutation.isPending}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(noc.id)}
                        disabled={deleteMutation.isPending || updateMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit NOC Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason:</label>
                  <Input
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    required
                    disabled={updateMutation.isPending}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Days for NOC:</label>
                  <Calendar
                    mode="multiple"
                    selected={editDays}
                    onSelect={setEditDays as any}
                    className="border rounded-md"
                    disabled={updateMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message:</label>
                  <Textarea
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    className="min-h-[150px]"
                    required
                    disabled={updateMutation.isPending}
                  />
                </div>

                {role === 'kr_admin' && selectedNOC && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status:</label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={selectedNOC.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as NOCStatus;
                        updateStatusMutation.mutate({
                          id: selectedNOC.id,
                          status: newStatus
                        });
                      }}
                      disabled={role !== 'kr_admin' || updateStatusMutation.isPending}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                )}

                <Button 
                  onClick={handleUpdate} 
                  className="w-full"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Updating..." : "Update NOC"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the NOC request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NOCList;
