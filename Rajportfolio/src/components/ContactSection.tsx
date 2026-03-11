import { motion } from "framer-motion";
import { Send, Github, Linkedin, Mail, CheckCircle2 } from "lucide-react";
import { useForm, ValidationError } from '@formspree/react';

const ContactSection = () => {
  const [state, handleSubmit] = useForm("xnjgdbpe");

  if (state.succeeded) {
    return (
      <section id="contact" className="py-16 px-4 md:px-12">
        <h2 className="netflix-section-title text-foreground mb-8">Contact Me</h2>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-lg text-center max-w-2xl mx-auto"
        >
          <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
          <h3 className="text-3xl font-display text-foreground mb-2">THANK YOU!</h3>
          <p className="text-muted-foreground text-lg">
            Your message has been sent successfully. I'll get back to you soon.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 text-primary hover:underline font-semibold"
          >
            Send another message
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-16 px-4 md:px-12">
      <h2 className="netflix-section-title text-foreground mb-8">Contact Me</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="font-display text-3xl text-foreground mb-4">
            LET'S WORK TOGETHER
          </h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Have a project in mind? Want to collaborate? Or just want to say hello?
            Drop me a message and I'll get back to you as soon as possible.
          </p>

          <div className="flex gap-4">
            {[
              { icon: Github, href: "https://github.com/RAJWARDHAN-B" },
              { icon: Linkedin, href: "https://linkedin.com/in/rajwardhan-bhandigare" },
              { icon: Mail, href: "mailto:rajwardhanpict@gmail.com" },
            ].map(({ icon: Icon, href }, idx) => (
              <a
                key={idx}
                href={href}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <div>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              required
            />
            <ValidationError 
              prefix="Name" 
              field="name"
              errors={state.errors}
              className="text-red-500 text-sm mt-1"
            />
          </div>
          <div>
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              required
            />
            <ValidationError 
              prefix="Email" 
              field="email"
              errors={state.errors}
              className="text-red-500 text-sm mt-1"
            />
          </div>
          <div>
            <textarea
              name="message"
              placeholder="Your Message"
              rows={4}
              className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              required
            />
            <ValidationError 
              prefix="Message" 
              field="message"
              errors={state.errors}
              className="text-red-500 text-sm mt-1"
            />
          </div>
          <button
            type="submit"
            disabled={state.submitting}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Message
              </>
            )}
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactSection;
