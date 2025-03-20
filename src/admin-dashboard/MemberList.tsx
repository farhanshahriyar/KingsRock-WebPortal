import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditMemberDialog } from "./EditMemberDialog";
import { formatDistanceToNow } from "date-fns";
import { ProtectedComponent } from "@/components/ProtectedComponent";

// Dummy data for UI demo
const mockUsers = [
  {
    id: "usr_123456789",
    avatar_url: "https://randomuser.me/api/portraits/men/1.jpg",
    username: "johndoe",
    full_name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    provider: "email",
    role: "kr_member",
    created_at: "2023-01-15T10:30:00Z",
    last_sign_in_at: "2023-06-10T14:20:00Z"
  },
  {
    id: "usr_987654321",
    avatar_url: "https://randomuser.me/api/portraits/women/2.jpg",
    username: "janedoe",
    full_name: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "+1 (555) 987-6543",
    provider: "google",
    role: "kr_manager",
    created_at: "2023-02-20T09:15:00Z",
    last_sign_in_at: "2023-06-12T11:45:00Z"
  },
  {
    id: "usr_456123789",
    avatar_url: "https://randomuser.me/api/portraits/men/3.jpg",
    username: "admin_user",
    full_name: "Admin User",
    email: "admin@example.com",
    phone: "+1 (555) 789-0123",
    provider: "email",
    role: "kr_admin",
    created_at: "2023-01-05T08:00:00Z",
    last_sign_in_at: "2023-06-15T13:30:00Z"
  }
];

export function MembersList() {
  const [users, setUsers] = useState(mockUsers);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = (userId: string) => {
    // This would connect to the backend in a real implementation
    setUsers(users.filter(user => user.id !== userId));
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = (updatedUser: any) => {
    // This would connect to the backend in a real implementation
    setUsers(users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    setIsEditDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>UID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url} alt={user.username} />
                    <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-mono text-xs">{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    {user.provider}
                  </span>
                </TableCell>
                <TableCell>
                  <span 
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      user.role === 'kr_admin' 
                        ? 'bg-purple-50 text-purple-700' 
                        : user.role === 'kr_manager' 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {user.role === 'kr_admin' 
                      ? 'KR Admin' 
                      : user.role === 'kr_manager' 
                        ? 'KR Manager' 
                        : 'KR Member'}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(user.created_at)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(user.last_sign_in_at)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <ProtectedComponent feature="members.edit">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </ProtectedComponent>
                    <ProtectedComponent feature="members.delete">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </ProtectedComponent>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditMemberDialog 
        user={selectedUser}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleUpdateUser}
      />
    </div>
  );
}