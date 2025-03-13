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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type LeaveStatus = 'pending' | 'approved' | 'rejected';

interface LeaveRequest {
  id: string;
  reason: string;
  message: string;
  requested_days: string[];
  status: LeaveStatus;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

// Create a custom event for leave status changes
export const LEAVE_STATUS_CHANGED_EVENT = 'leave-status-changed';

const LeaveRequestList = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [editReason, setEditReason] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editDays, setEditDays] = useState<Date[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { role } = useRole();

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to view leave requests",
          variant: "destructive",
        });
        return;
      }

      // If not admin, only fetch user's own requests
      const query = supabase
        .from('leave_requests')
        .select('*');

      if (role !== 'kr_admin') {
        query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leave requests:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const validRequests = (data || []).map(request => ({
        ...request,
        status: request.status as LeaveStatus
      }));

      setRequests(validRequests);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leave requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [role]); // Re-fetch when role changes

  const handleEdit = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setEditReason(request.reason);
    setEditMessage(request.message || "");
    setEditDays(request.requested_days.map(day => new Date(day)));
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leave request deleted successfully",
      });

      fetchRequests();
      
      // Dispatch event to update parent component
      window.dispatchEvent(new CustomEvent(LEAVE_STATUS_CHANGED_EVENT));
    } catch (error) {
      console.error('Error deleting leave request:', error);
      toast({
        title: "Error",
        description: "Failed to delete leave request",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedRequest) return;

    try {
      // Save original status
      const originalStatus = selectedRequest.status;
      
      const { error } = await supabase
        .from('leave_requests')
        .update({
          reason: editReason,
          message: editMessage,
          requested_days: editDays.map(date => date.toISOString().split('T')[0]),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leave request updated successfully",
      });

      setIsDialogOpen(false);
      fetchRequests();
      
      // Dispatch event to update parent component if it's an approved leave
      if (originalStatus === 'approved') {
        window.dispatchEvent(new CustomEvent(LEAVE_STATUS_CHANGED_EVENT));
      }
    } catch (error) {
      console.error('Error updating leave request:', error);
      toast({
        title: "Error",
        description: "Failed to update leave request",
        variant: "destructive",
      });
    }
  };

  // Function to update status
  const updateStatus = async (requestId: string, newStatus: LeaveStatus, previousStatus: LeaveStatus) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      // Find the request to get its days for better toast message
      const request = requests.find(r => r.id === requestId);
      const daysCount = request?.requested_days.length || 0;
      
      toast({
        title: "Status Updated",
        description: `Request ${newStatus === 'approved' ? 'approved' : newStatus}${newStatus === 'approved' ? ` (${daysCount} days)` : ''}`,
      });
      
      // Important: Dispatch event to trigger leave counter update in parent
      window.dispatchEvent(new CustomEvent(LEAVE_STATUS_CHANGED_EVENT));
      
      // Refresh the list
      await fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {
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

  const calculateLeaveDays = (days: string[]) => {
    return `${days.length} ${days.length === 1 ? 'day' : 'days'}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            Loading leave requests...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Leave Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No leave requests found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Leave Reason</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Leave Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request, index) => (
                <TableRow key={request.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{request.reason}</TableCell>
                  <TableCell>{request.message}</TableCell>
                  <TableCell>{calculateLeaveDays(request.requested_days)}</TableCell>
                  <TableCell>
                    {role === 'kr_admin' ? (
                      <Select
                        defaultValue={request.status}
                        onValueChange={(value: LeaveStatus) => {
                          const previousStatus = request.status;
                          updateStatus(request.id, value, previousStatus);
                        }}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      getStatusBadge(request.status)
                    )}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(request)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(request.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Leave Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason:</Label>
                <Input
                  id="reason"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Days for Leave:</Label>
                <Calendar
                  mode="multiple"
                  selected={editDays}
                  onSelect={setEditDays as any}
                  className="border rounded-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message:</Label>
                <Textarea
                  id="message"
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="min-h-[150px]"
                  required
                />
              </div>

              {role === 'kr_admin' && selectedRequest && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status:</Label>
                  <Select
                    defaultValue={selectedRequest.status}
                    onValueChange={(value: LeaveStatus) => {
                      const previousStatus = selectedRequest.status;
                      setSelectedRequest({
                        ...selectedRequest,
                        status: value as LeaveStatus
                      });
                    }}
                    disabled={role !== 'kr_admin'}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button onClick={handleUpdate} className="w-full">
                Update Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default LeaveRequestList;
