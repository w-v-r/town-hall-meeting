import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-[8rem] font-bold leading-none tracking-tight mb-22">
          HALL HANDS
        </h1>
        <h2 className="text-4xl font-bold mb-4">Town Hall /// All Hands</h2>
        <Link 
          href="/admin"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
        >
          Create Meeting Plan
        </Link>
      </div>
    </div>
  )
}
