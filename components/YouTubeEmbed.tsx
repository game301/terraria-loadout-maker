interface YouTubeEmbedProps {
    url: string
    title?: string
}

export default function YouTubeEmbed({
    url,
    title = "YouTube video",
}: YouTubeEmbedProps) {
    // Extract YouTube video ID from URL
    const getYouTubeId = (url: string) => {
        // Handle YouTube Shorts URLs
        const shortsMatch = url.match(/shorts\/([^?&]+)/)
        if (shortsMatch && shortsMatch[1]) {
            return shortsMatch[1]
        }

        // Handle regular YouTube URLs
        const regExp =
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        return match && match[2] ? match[2] : null
    }

    const videoId = getYouTubeId(url)

    if (!videoId) {
        return null
    }

    return (
        <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
            <h3 className='text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider'>
                Video Guide
            </h3>
            <div
                className='relative'
                style={{
                    paddingBottom: "56.25%",
                }}>
                <iframe
                    className='absolute top-0 left-0 w-full h-full rounded'
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={title}
                    frameBorder='0'
                    allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                    allowFullScreen
                />
            </div>
        </div>
    )
}
