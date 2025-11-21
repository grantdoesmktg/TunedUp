import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen gradient-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-highlight rounded-full blur-[120px] animate-pulse delay-700"></div>
        </div>

        <div className="container mx-auto px-6 py-20 relative z-10">
          {/* Logo/Header */}
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-8xl font-black mb-4 gradient-text">
              TunedUp
            </h1>
            <p className="text-xl md:text-2xl text-textSecondary font-medium">
              Your AI Garage in Your Pocket
            </p>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            {/* Hero Statement */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Rev Up Your Build with{' '}
                <span className="gradient-text">AI-Powered Intelligence</span>
              </h2>
              <p className="text-lg md:text-xl text-textSecondary mb-8 leading-relaxed">
                From quarter-mile times to custom visuals, TunedUp Garage is the ultimate
                toolkit for automotive enthusiasts. Calculate performance, plan your dream build,
                and generate stunning car renders—all powered by cutting-edge AI.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              <div className="bg-secondary/50 backdrop-blur-sm border border-divider rounded-2xl p-6 hover:border-primary transition-all duration-300 hover:scale-105">
                <div className="text-4xl mb-4">🏎️</div>
                <h3 className="text-xl font-bold mb-2 text-primary">Performance Calculator</h3>
                <p className="text-textSecondary text-sm">
                  Predict horsepower, torque, and 0-60 times based on your mods.
                  Know what your ride can really do.
                </p>
              </div>

              <div className="bg-secondary/50 backdrop-blur-sm border border-divider rounded-2xl p-6 hover:border-highlight transition-all duration-300 hover:scale-105">
                <div className="text-4xl mb-4">🔧</div>
                <h3 className="text-xl font-bold mb-2 text-highlight">Build Planner</h3>
                <p className="text-textSecondary text-sm">
                  Get AI-powered recommendations for your build. Parts, costs,
                  and upgrade paths—all customized for your car.
                </p>
              </div>

              <div className="bg-secondary/50 backdrop-blur-sm border border-divider rounded-2xl p-6 hover:border-success transition-all duration-300 hover:scale-105">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-xl font-bold mb-2 text-success">AI Image Generator</h3>
                <p className="text-textSecondary text-sm">
                  Visualize your dream build before you wrench. Generate photorealistic
                  renders of your customized ride.
                </p>
              </div>
            </div>

            {/* Social Proof / Extra Features */}
            <div className="bg-secondary/30 backdrop-blur-sm border border-divider rounded-2xl p-8 mb-16">
              <h3 className="text-2xl font-bold mb-6 text-center">
                Plus, Join the Community 🏁
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-textSecondary">
                <div className="flex items-start gap-3">
                  <span className="text-primary text-2xl">✓</span>
                  <div>
                    <p className="font-semibold text-textPrimary mb-1">Share Your Builds</p>
                    <p className="text-sm">Post photos of your ride and get feedback from fellow gearheads</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary text-2xl">✓</span>
                  <div>
                    <p className="font-semibold text-textPrimary mb-1">Save Everything</p>
                    <p className="text-sm">Keep all your calculations, images, and build plans in one place</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary text-2xl">✓</span>
                  <div>
                    <p className="font-semibold text-textPrimary mb-1">Turbo Tycoon Game</p>
                    <p className="text-sm">Build your empire in our addictive idle clicker mini-game</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary text-2xl">✓</span>
                  <div>
                    <p className="font-semibold text-textPrimary mb-1">Token System</p>
                    <p className="text-sm">Free tier included, upgrade for unlimited AI power</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center">
              <Link
                href="https://apps.apple.com/us/app/tunedup-garage/id6755053244"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <button className="bg-gradient-to-r from-primary to-highlight text-background font-bold text-lg px-12 py-4 rounded-full hover:scale-105 transition-transform duration-200 shadow-2xl hover:shadow-primary/50">
                  Download on the App Store
                </button>
              </Link>
              <p className="mt-6 text-textSecondary text-sm">
                Available on iOS • Free with in-app purchases
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-divider mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-textSecondary text-sm">
            <p>© 2024 TunedUp Garage. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
