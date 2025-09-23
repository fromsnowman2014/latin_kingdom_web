import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-game-primary to-green-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold font-game text-white mb-4">
          Latin Kingdom
        </h1>
        <p className="text-2xl text-green-200 mb-8">
          Tower Defense Learning Game
        </p>
        <p className="text-lg text-green-300 mb-12 max-w-2xl">
          Defend your castle while learning Latin vocabulary! Build towers, defeat enemies,
          and master ancient words in this exciting educational adventure.
        </p>

        <div className="space-y-4 mb-8">
          <Link
            href="/game"
            className="inline-block bg-game-accent hover:bg-yellow-400 text-gray-900 font-bold py-4 px-8 rounded-lg text-xl transition-colors shadow-lg"
          >
            Start Playing
          </Link>
        </div>

        <div className="bg-green-800 bg-opacity-50 border border-green-600 text-green-200 px-6 py-4 rounded-lg">
          <p className="font-bold">🎮 Game Features</p>
          <ul className="text-sm mt-2 space-y-1">
            <li>• Tower Defense gameplay with 3 tower types</li>
            <li>• Real-time Latin vocabulary learning</li>
            <li>• 4 enemy types with increasing difficulty</li>
            <li>• Progressive hint system for learning</li>
            <li>• Educational progress tracking</li>
          </ul>
        </div>
      </div>
    </main>
  )
}