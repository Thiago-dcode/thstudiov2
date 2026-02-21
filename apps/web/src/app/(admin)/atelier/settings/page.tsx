import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { redirect } from "next/navigation";
import { AdminPageContainer, AdminPageTitle } from "../../__components/admin-page.component";
import { EditUserPasswordDialog } from "./_components/edit-user-password.dialog";
import { EditUserUsernameDialog } from "./_components/edit-user-username.dialog";
import { KeyRound, Mail, User } from "lucide-react";
import usersService from "@/modules/users/users.service";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";

export default async function SettingsPage() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }

    const userResponse = await usersService.getOne(userAuth.id);
    if (!userResponse.data) {
        redirect('/');
    }

    const user = userResponse.data;

    return (
        <AdminPageContainer>
            <AdminPageTitle title="Settings" />

            <div className="flex flex-col gap-4 max-w-lg">

                {/* Account info */}
                <section className="border border-fg-2 rounded-md divide-y divide-fg-2">
                    <div className="px-4 py-3">
                        <h2 className="text-sm font-medium text-text-muted">Account</h2>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                            <User className="size-4 text-text-muted" />
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium">{user.username}</p>
                                    <InfoTooltip content="Your username appears in your public URL. Pick something short and memorable — you can't change it often." />
                                </div>
                                <p className="text-xs text-text-muted">Username</p>
                            </div>
                        </div>
                        <EditUserUsernameDialog user={user} />
                    </div>

                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                            <Mail className="size-4 text-text-muted" />
                            <div>
                                <p className="text-sm font-medium">{user.email}</p>
                                <p className="text-xs text-text-muted">Email</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Security */}
                <section className="border border-fg-2 rounded-md divide-y divide-fg-2">
                    <div className="px-4 py-3">
                        <h2 className="text-sm font-medium text-text-muted">Security</h2>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                            <KeyRound className="size-4 text-text-muted" />
                            <div>
                                <p className="text-sm font-medium">Password</p>
                                <p className="text-xs text-text-muted">Update your account password</p>
                            </div>
                        </div>
                        <EditUserPasswordDialog user={user} />
                    </div>
                </section>

            </div>
        </AdminPageContainer>
    );
}
