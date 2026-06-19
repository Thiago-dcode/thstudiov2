"use client";
import { Button } from "@repo/ui/components/shadcn/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useMainNav } from "@/lib/providers/main-nav.provider";
import { logoutServerAction } from "@/modules/auth/server-actions/logout.action";

export const LogoutDialog = () => {
 const router = useRouter();
 const { shrinked } = useMainNav();
 const [open, setOpen] = useState(false);
 const [loading, setLoading] = useState(false);

 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
 if (loading) return;
 setLoading(true);
 e.preventDefault();
 const result = await logoutServerAction();

 if (!result) {
 setLoading(false);
 return;
 }
 router.push("/auth/login");
 };

 return (
 <Dialog open={open} onOpenChange={setOpen}>
 <DialogTrigger asChild>
 <button
 type="button"
 className={`cursor-pointer flex items-center gap-3 px-3 py-2 transition-colors text-red-400 hover:bg-red-500/10 w-full
 ${shrinked ? "justify-center" : ""}
 `}
 >
 <LogOut size={20} />
 {!shrinked && <span>Logout</span>}
 </button>
 </DialogTrigger>
 <DialogContent className="max-w-sm">
 {!loading ? (
 <>
 <DialogHeader>
 <DialogTitle>Logout</DialogTitle>
 <DialogDescription>
 Are you sure you want to logout? You'll need to sign in again to
 access your account.
 </DialogDescription>
 </DialogHeader>
 <div className="flex items-center justify-end gap-3 mt-4">
 <Button variant="outline" onClick={() => setOpen(false)}>
 Cancel
 </Button>
 <form onSubmit={handleSubmit}>
 <Button disabled={loading} type="submit">
 Logout
 </Button>
 </form>
 </div>
 </>
 ) : (
 <div className="flex items-center justify-center py-8">
 <Spinner className="size-10" />
 </div>
 )}
 </DialogContent>
 </Dialog>
 );
};
