import Image from 'next/image';

import { useState, ChangeEvent, KeyboardEvent } from 'react';

interface LoginProps {
  username: string;
  handlePlayClick: (username: string) => void;
}

const Login: React.FC<LoginProps> = (props) => {
  const { username, handlePlayClick } = props;
  const [inputName, setInputName] = useState('Anonymous');

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputName(event.target.value);
  };
  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handlePlayClick(inputName);
    }
  };

  return (
    <>
      <section className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12">
        <div className="relative flex w-full max-w-md flex-col items-center">
          <div className="-mb-12 flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-border-main bg-white shadow-xl">
            <Image
              src="/img/favicon.svg"
              alt="Block Empire"
              width={80}
              height={80}
              priority
            />
          </div>

          <div className="card w-full pt-16 text-center shadow-lg">
            <h1 className="text-2xl font-semibold text-text-primary">
              登录方块帝国
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              输入昵称即可加入战场，昵称长度不超过 15 个字符
            </p>

            <div className="mt-6 flex w-full flex-col gap-4">
              <input
                className="input w-full text-center"
                id="username"
                name="username"
                placeholder="输入用户名"
                maxLength={15}
                value={inputName}
                onChange={handleUsernameChange}
                onKeyDown={handleInputKeyDown}
              />
              <button
                type="button"
                className="btn-primary w-full justify-center"
                onClick={() => handlePlayClick(inputName)}
              >
                开始游戏
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Login;
