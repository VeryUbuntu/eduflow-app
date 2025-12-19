import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
    width: 32,
    height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'transparent',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    {/* 青色曲线 (cyan-600: #0891b2) */}
                    <path
                        d="M15,50 Q35,20 50,50 T85,50"
                        fill="none"
                        stroke="#0891b2"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />
                    {/* 中心圆点 */}
                    <circle cx="50" cy="50" r="12" fill="#0891b2" />
                </svg>
            </div>
        ),
        {
            ...size,
        }
    )
}
