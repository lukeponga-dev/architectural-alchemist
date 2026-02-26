/**
 * AgentPanel component that displays a message in an agent panel interface
 * @param {string} message - The message to be displayed in the panel
 * @returns {JSX.Element} - A React component that renders the agent panel with the provided message
 */
export default function AgentPanel({ message }: { message: string }) {
  return (
    <div className="backdrop-blur-lg bg-white/20 p-4 rounded-xl text-cyan-400 font-mono">
      {message}
    </div>
  );
}
