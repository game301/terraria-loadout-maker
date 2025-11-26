export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <div className='max-w-7xl mx-auto w-full p-4'>{children}</div>
}
