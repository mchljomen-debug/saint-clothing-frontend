import React from "react";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import ForYouCollection from "../components/ForYouCollection";
import BestSeller from "../components/BestSeller";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";

const Home = () => {
  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
        <div className="mb-4 sm:mb-5">
          <Hero />
        </div>

        <div className="mb-4 sm:mb-5">
          <section id="latest-collection-section">
            <LatestCollection />
          </section>
        </div>

        <div className="mb-4 sm:mb-5">
          <section id="best-seller-section">
            <BestSeller />
          </section>
        </div>

        <div className="mb-4 sm:mb-5">
          <section id="for-you-section">
            <ForYouCollection />
          </section>
        </div>

        <div className="mt-4">
          <OurPolicy />
        </div>

        <div className="mt-4 pb-4 sm:pb-6">
          <NewsletterBox />
        </div>
      </div>
    </div>
  );
};

export default Home;