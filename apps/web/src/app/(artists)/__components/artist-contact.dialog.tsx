'use client'

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/shadcn/dialog"
import { Button } from "@repo/ui/components/shadcn/button"
import { Mail } from "lucide-react"
import { Spinner } from "@repo/ui/components/shadcn/spinner"
import FormComponent from "@/lib/components/form-component"
import { useArtist } from "@/modules/users/providers/artist.provider"

export const ArtistContactDialog = ({ children }: { children?: React.ReactNode }) => {
    const [open, setOpen] = useState(false)
    const { artist, isPending: loadingArtist } = useArtist()

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        // TODO: wire up server action
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild className="cursor-pointer">
                {children ?? (
                    <Button variant="default" size="sm">
                        <Mail className="size-3.5" />
                        Contact
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-w-xl p-6 min-h-[400px]">
                <DialogHeader className="gap-1">
                    <DialogTitle className="text-base font-semibold tracking-tight">
                        {artist ? `Contact ${artist.name ? `${artist.name} ${artist.surname ?? ''}`.trim() : artist.username}` : 'Contact'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-text-muted">
                        Send a message directly to this artist.
                    </DialogDescription>
                </DialogHeader>

                {loadingArtist && !artist && (
                    <div className="absolute inset-0 flex items-center justify-center bg-bg/80 backdrop-blur-sm z-50 rounded-lg">
                        <Spinner className="size-8" />
                    </div>
                )}

                <FormComponent.Container >
                    <FormComponent.Form onSubmit={handleSubmit} >
                        <FormComponent.LabelInput
                            label="Name"
                            id="contact-name"
                            name="name"
                            placeholder="Your name"
                            required
                        />

                        <FormComponent.LabelInput
                            label="Email"
                            id="contact-email"
                            name="email"
                            type="email"
                            placeholder="your@email.com"
                            required
                        />

                        <FormComponent.LabelInput
                            label="Subject"
                            id="contact-subject"
                            name="subject"
                            placeholder="Commission inquiry"
                            required
                        />

                        <FormComponent.LabelTextarea
                            label="Message"
                            id="contact-message"
                            name="message"
                            placeholder="Tell the artist about your project..."
                            rows={4}
                            required
                        />

                        <FormComponent.SubmitButton isPending={loadingArtist}>
                            Send Message
                        </FormComponent.SubmitButton>
                    </FormComponent.Form>
                </FormComponent.Container>
            </DialogContent>
        </Dialog>
    )
}
