import { Brand } from "@/shared/components/brand";
import { Button } from "@/components/ui/button";

type LoginScreenProps = {
  error: string;
  onSignIn: () => void;
};

export function LoginScreen({ error, onSignIn }: LoginScreenProps) {
  return (
    <main className="login-page">
      <section className="login-copy">
        <Brand large />
        <p className="eyebrow">Small promises. Visible progress.</p>
        <h1>Make consistency something you can see.</h1>
        <p className="login-description">
          A quiet daily task list with a year of progress built right in. Check
          in, mark it done, and let the days add up.
        </p>
        <Button className="google-button" onClick={onSignIn} type="button">
          <span className="google-g" aria-hidden="true">
            G
          </span>
          Continue with Google
        </Button>
        {error && <p className="error-message">{error}</p>}
        <p className="privacy-note">
          No password to remember. Daymark only uses your Google account to keep
          your tasks private and synced.
        </p>
      </section>
      <section className="login-visual" aria-hidden="true">
        <div className="visual-card">
          <div className="visual-topline">
            <span>This year</span>
            <span>184 days marked</span>
          </div>
          <div className="visual-grid">
            {Array.from({ length: 140 }, (_, index) => (
              <span
                className={`visual-cell visual-level-${(index * 7 + index * index) % 5}`}
                key={index}
              />
            ))}
          </div>
          <div className="visual-quote">
            “A little, often, becomes a lot.”
          </div>
        </div>
      </section>
    </main>
  );
}
