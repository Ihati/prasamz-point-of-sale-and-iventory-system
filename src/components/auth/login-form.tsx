
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

function ForgotPasswordDialog() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { sendPasswordReset } = useUser();
  const { toast } = useToast();

  const handleReset = async () => {
    if (!email) {
      toast({ title: 'Email Required', description: 'Please enter your email address.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const success = await sendPasswordReset(email);
    if (success) {
      toast({ title: 'Password Reset Email Sent', description: `If an account exists for ${email}, a reset link has been sent.` });
      setOpen(false); // Close dialog on success
    }
    // Error toast is handled by the hook
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto">Forgot Password?</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Your Password</DialogTitle>
          <DialogDescription>
            Enter the email address for your account. We will send you a link to reset your password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reset-email">Email Address</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="e.g., admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleReset} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export function LoginForm() {
  const [adminPassword, setAdminPassword] = useState('admin');
  const [staffPassword, setStaffPassword] = useState('staff');

  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useUser();

  const handleLogin = async (role: 'admin' | 'staff') => {
    const email = role === 'admin' ? 'admin@example.com' : 'staff@example.com';
    const password = role === 'admin' ? adminPassword : staffPassword;

    if (!password) {
      toast({ title: 'Login Failed', description: 'Please enter a password.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Select your role and enter your password.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="staff" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
          
          <TabsContent value="staff">
             <Card className="border-0 shadow-none">
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="staff-password">Staff Password</Label>
                  <div className="relative">
                    <Input 
                      id="staff-password" 
                      type={showStaffPassword ? 'text' : 'password'}
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      disabled={loading}
                      placeholder="Enter your password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowStaffPassword(prev => !prev)}
                      disabled={loading}
                    >
                      {showStaffPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showStaffPassword ? 'Hide password' : 'Show password'}</span>
                    </Button>
                  </div>
                   <div className='flex justify-end text-sm'>
                    <ForgotPasswordDialog />
                </div>
                </div>
              </CardContent>
              <CardFooter>
                 <Button className="w-full" onClick={() => handleLogin('staff')} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login as Staff
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="admin">
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-4 pt-6">
                 <div className="space-y-2">
                  <Label htmlFor="admin-password">Admin Password</Label>
                   <div className="relative">
                    <Input 
                      id="admin-password" 
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      disabled={loading}
                      placeholder="Enter your password"
                      className="pr-10"
                    />
                     <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowAdminPassword(prev => !prev)}
                      disabled={loading}
                    >
                      {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showAdminPassword ? 'Hide password' : 'Show password'}</span>
                    </Button>
                  </div>
                  <div className='flex justify-end text-sm'>
                    <ForgotPasswordDialog />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                 <Button className="w-full" onClick={() => handleLogin('admin')} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login as Admin
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
