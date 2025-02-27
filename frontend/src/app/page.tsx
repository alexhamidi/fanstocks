// Importing next/link for client-side navigation

export default async function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex justify-center px-4 mt-[30vh] py-8">
        <div className="text-center">
          <h1 className="text-4xl font-semibold dark:text-white mb-4">
            FanStocks
          </h1>
          <div className="text-sm text-gray-700 dark:text-gray-300 font-mono">
            trading, for your community.
          </div>
        </div>
      </main>
    </div>
  );
}
