"use client";

export default function ConnectSocialAccounts() {
  const connectMeta = () => {
    window.location.href =
      `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_CLIENT_ID}` +
      `&redirect_uri=${process.env.NEXT_PUBLIC_META_REDIRECT_URI}` +
      `&scope=pages_show_list,pages_read_engagement,instagram_basic`;
  };

  const connectLinkedIn = () => {
    window.location.href =
      `https://www.linkedin.com/oauth/v2/authorization?response_type=code` +
      `&client_id=${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID}` +
      `&redirect_uri=${process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI}` +
      `&scope=w_member_social%20r_liteprofile`;
  };

  const connectTikTok = () => {
    window.location.href =
      `https://www.tiktok.com/v2/auth/authorize/` +
      `?client_key=${process.env.NEXT_PUBLIC_TIKTOK_CLIENT_ID}` +
      `&scope=user.info.basic,video.publish` +
      `&response_type=code` +
      `&redirect_uri=${process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI}`;
  };

  const buttonStyle =
    "w-full px-5 py-4 rounded-xl font-semibold text-sm transition-all border";

  return (
    <div className="space-y-4 max-w-md">
      <h2 className="text-xl font-bold mb-2">Connect Accounts</h2>

      <button
        onClick={connectMeta}
        className={`${buttonStyle} bg-blue-600 text-white border-blue-600 hover:bg-blue-700`}
      >
        Connect Instagram / Meta
      </button>

      <button
        onClick={connectLinkedIn}
        className={`${buttonStyle} bg-[#0A66C2] text-white border-[#0A66C2] hover:opacity-90`}
      >
        Connect LinkedIn
      </button>

      <button
        onClick={connectTikTok}
        className={`${buttonStyle} bg-black text-white border-black hover:opacity-80`}
      >
        Connect TikTok
      </button>

      <p className="text-xs text-gray-500 pt-2">
        After connecting, you’ll be redirected back automatically.
      </p>
    </div>
  );
}