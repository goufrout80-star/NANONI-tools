import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-4xl font-black mb-8">Terms of Service</h1>
          
          <section className="space-y-4 text-soft-gray leading-relaxed">
            <h2 className="text-2xl font-bold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using NANONI Studio, you agree to be bound by these Terms of Service and all applicable laws and regulations. 
              If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-8">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on NANONI Studio's website for personal, non-commercial transitory viewing only.
            </p>
            <p>This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>modify or copy the materials;</li>
              <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>attempt to decompile or reverse engineer any software contained on NANONI Studio's website;</li>
              <li>remove any copyright or other proprietary notations from the materials; or</li>
              <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>

            <h2 className="text-2xl font-bold text-foreground mt-8">3. Disclaimer</h2>
            <p>
              The materials on NANONI Studio's website are provided on an 'as is' basis. NANONI Studio makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-8">4. Limitations</h2>
            <p>
              In no event shall NANONI Studio or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on NANONI Studio's website.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-8">5. Revisions</h2>
            <p>
              NANONI Studio may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
