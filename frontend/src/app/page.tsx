// Importing next/link for client-side navigation

export default async function Home() {
  return (
    <main className="flex flex-col justify-center items-center flex-grow">
        <div className="text-center">
          <h1 className="text-4xl font-semibold dark:text-white">
            FanStocks
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-4 font-mono ">
            trading, for your community.
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-4 font-mono hover:underline">
            [feature images]
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-4 font-mono hover:underline">
            [chat excerpts]
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-4 font-mono hover:underline">
            [testimonials]
          </p>
        </div>
      </main>
  );
}
