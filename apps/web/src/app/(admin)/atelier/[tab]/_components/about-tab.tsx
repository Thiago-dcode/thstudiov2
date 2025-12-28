'use client'

import { useTab } from "./tab.provider";

export default function AboutTab() {
    const { user } = useTab();
    return (
        <section className="w-full max-w-4xl p-6">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <p className="text-gray-600">
                About section for {user.username}
            </p>
        </section>
    );
}

