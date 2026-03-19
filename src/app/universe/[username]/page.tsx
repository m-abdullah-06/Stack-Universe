import { Metadata, ResolvingMetadata } from "next";
import UniverseClient from "./UniverseClient";

interface Props {
  params: { username: string };
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const username = params.username.replace(/^@/, "");
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://stack-universe.vercel.app";

  // Fetch basic data for metadata
  try {
    const res = await fetch(`${baseUrl}/api/github/${username}`);
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();

    const ogImage = `${baseUrl}/api/og?u=${username}`;

    return {
      title: `${username}'s Universe | Stack Universe`,
      description: `Explore the cosmic profile of ${username} with a universe score of ${data.universeScore.toLocaleString()}!`,
      openGraph: {
        title: `${username}'s Universe`,
        description: `Explore the cosmic profile of ${username} with a universe score of ${data.universeScore.toLocaleString()}!`,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${username}'s Universe Profile`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${username}'s Universe`,
        description: `Explore the cosmic profile of ${username} with a universe score of ${data.universeScore.toLocaleString()}!`,
        images: [ogImage],
      },
    };
  } catch (e) {
    return {
      title: "Universe | Stack Universe",
      description: "Explore developer universes in the multiverse.",
    };
  }
}

export default function Page() {
  return <UniverseClient />;
}
