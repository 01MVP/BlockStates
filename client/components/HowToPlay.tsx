import Modal from '@/components/ui/Modal';
import Image from 'next/image';
import { TileType, TileType2Image } from '@/lib/types';

interface HowToPlayProps {
  show: boolean;
  toggleShow: () => void;
}

const HowToPlay: React.FC<HowToPlayProps> = ({ show, toggleShow }) => {
  const tableData = [
    { label: '移动', value: 'WSAD / 方向键 / 鼠标点击 / 手机拖拽' },
    { label: '打开聊天', value: '回车键' },
    { label: '投降', value: 'Esc' },
    { label: '选择将军', value: 'G' },
    { label: '聚焦将军', value: 'H' },
    { label: '地图居中', value: 'C' },
    { label: '切换50%', value: 'Z / 鼠标两次点击 / 手机：快速触摸两次' },
    { label: '撤销移动', value: 'E' },
    { label: '清除队列中的移动', value: 'Q' },
    { label: '设置预设缩放', value: '1 / 2 / 3' },
    { label: '缩放', value: '鼠标滚轮' },
  ];

  return (
    <Modal
      open={show}
      onClose={toggleShow}
      title="如何玩"
      size="lg"
      footer={
        <button type="button" className="btn-secondary" onClick={toggleShow}>
          知道了
        </button>
      }
    >
      <div className="space-y-6 text-sm leading-relaxed text-text-muted">
        <div className="rounded-lg border-2 border-border-main bg-bg-light px-4 py-3">
          <p className="flex items-center gap-2 text-base text-text-primary">
            你的目标是占领其他所有玩家的将军
            <Image
              src={TileType2Image[TileType.King]}
              alt="king"
              width={20}
              height={20}
              className="rounded border border-border-subtle bg-white"
            />
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>平原每 25 回合产生一个小兵，尽可能扩张你的领土！</li>
            <li className="flex items-center gap-2">
              <Image
                src={TileType2Image[TileType.City]}
                alt="city"
                width={20}
                height={20}
                className="rounded border border-border-subtle bg-white"
              />
              城市与将军每回合产生一个小兵
            </li>
            <li>你每回合可以移动两次。</li>
            <li>占领敌方将军后，他的所有领土与兵力都会归属你，但兵力会减半。</li>
          </ul>
        </div>

        <div>
          <h3 className="card-title mb-3 text-base font-medium">快捷键</h3>
          <div className="overflow-hidden rounded-lg border-2 border-border-main">
            <table className="min-w-full divide-y-2 divide-border-subtle text-left">
              <thead className="bg-bg-main text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3">快捷键</th>
                  <th className="px-4 py-3">键位</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-white text-sm">
                {tableData.map((row, index) => (
                  <tr key={index} className="hover:bg-bg-main/60">
                    <td className="px-4 py-2 font-medium text-text-primary">
                      {row.label}
                    </td>
                    <td className="px-4 py-2 text-text-muted">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default HowToPlay;
