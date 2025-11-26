"use client"

import { useEffect, useState } from "react"

interface ToastProps {
    message: string
    show: boolean
    onClose: () => void
    duration?: number
}

export function Toast({ message, show, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose()
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [show, onClose, duration])

    if (!show) return null

    return (
        <div className='fixed bottom-4 right-4 z-[100] animate-in slide-in-from-bottom-5'>
            <div className='bg-gradient-to-br from-green-600 to-green-700 border-2 border-green-400 rounded-lg shadow-lg px-6 py-3 flex items-center gap-3'>
                <svg
                    className='w-5 h-5 text-foreground'
                    fill='none'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                    stroke='currentColor'>
                    <path d='M5 13l4 4L19 7'></path>
                </svg>
                <span className='text-foreground font-medium'>{message}</span>
            </div>
        </div>
    )
}
