'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Search, MoreHorizontal } from 'lucide-react';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
}

interface UserManagementProps {
  users: User[];
  onUserUpdate: (userId: string, updates: Partial<User>) => Promise<void>;
  onUserDelete: (userId: string) => Promise<void>;
  onUserCreate: (user: Omit<User, '_id' | 'createdAt'>) => Promise<void>;
}

export function UserManagement({ users, onUserCreate }: UserManagementProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState<{
    email: string;
    name: string;
    role: 'admin' | 'user' | 'viewer';
    status: 'active' | 'inactive';
  }>({
    email: '',
    name: '',
    role: 'user',
    status: 'active',
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async () => {
    try {
      await onUserCreate(newUser);
      setShowCreateDialog(false);
      setNewUser({ email: '', name: '', role: 'user', status: 'active' });
      toast({
        title: language === 'en' ? 'User created' : 'تم إنشاء المستخدم',
        description: language === 'en' ? 'New user has been created successfully' : 'تم إنشاء المستخدم الجديد بنجاح',
      });
    } catch {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Failed to create user' : 'فشل في إنشاء المستخدم',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'user': return 'default';
      case 'viewer': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {language === 'en' ? 'User Management' : 'إدارة المستخدمين'}
          </CardTitle>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Add User' : 'إضافة مستخدم'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {language === 'en' ? 'Create New User' : 'إنشاء مستخدم جديد'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder={language === 'en' ? 'Name' : 'الاسم'}
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  type="email"
                  placeholder={language === 'en' ? 'Email' : 'البريد الإلكتروني'}
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                />
                <Select 
                  value={newUser.role} 
                  onValueChange={(value: 'admin' | 'user' | 'viewer') => 
                    setNewUser(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">
                      {language === 'en' ? 'Viewer' : 'مشاهد'}
                    </SelectItem>
                    <SelectItem value="user">
                      {language === 'en' ? 'User' : 'مستخدم'}
                    </SelectItem>
                    <SelectItem value="admin">
                      {language === 'en' ? 'Admin' : 'مدير'}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateUser} className="w-full">
                  {language === 'en' ? 'Create User' : 'إنشاء المستخدم'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'en' ? 'Search users...' : 'البحث عن المستخدمين...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === 'en' ? 'All Roles' : 'جميع الأدوار'}
              </SelectItem>
              <SelectItem value="admin">
                {language === 'en' ? 'Admin' : 'مدير'}
              </SelectItem>
              <SelectItem value="user">
                {language === 'en' ? 'User' : 'مستخدم'}
              </SelectItem>
              <SelectItem value="viewer">
                {language === 'en' ? 'Viewer' : 'مشاهد'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === 'en' ? 'Name' : 'الاسم'}</TableHead>
              <TableHead>{language === 'en' ? 'Email' : 'البريد الإلكتروني'}</TableHead>
              <TableHead>{language === 'en' ? 'Role' : 'الدور'}</TableHead>
              <TableHead>{language === 'en' ? 'Status' : 'الحالة'}</TableHead>
              <TableHead>{language === 'en' ? 'Last Login' : 'آخر تسجيل دخول'}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {language === 'en' ? user.role : 
                      user.role === 'admin' ? 'مدير' : 
                      user.role === 'user' ? 'مستخدم' : 'مشاهد'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                    {language === 'en' ? user.status : 
                      user.status === 'active' ? 'نشط' : 'غير نشط'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.lastLogin 
                    ? new Date(user.lastLogin).toLocaleDateString()
                    : language === 'en' ? 'Never' : 'أبداً'}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}