import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { TileType, TileType2Image } from '@/lib/types';

interface HowToPlayProps {
  show: boolean;
  toggleShow: any;
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
    <div>
      <Dialog open={show} onClose={toggleShow}>
        <DialogTitle>如何玩</DialogTitle>
        <DialogContent>
          <div>
            <div style={{ display: 'flex' }}>
              <Typography variant='body1'>你的目标是占领其他所有玩家的将军</Typography>
              <Image
                src={TileType2Image[TileType.King]}
                alt='king'
                width='20'
                height='20'
                style={{
                  backgroundColor: 'white',
                }}
              />
            </div>

            <ul>
              <li>平原每25回合产生一个小兵，尽可能扩张你的领土！</li>
              <li>
                <div style={{ display: 'flex' }}>
                  <Image
                    src={TileType2Image[TileType.City]}
                    alt='king'
                    width='20'
                    height='20'
                    style={{
                      backgroundColor: 'white',
                    }}
                  />
                  城市和将军每回合产生一个小兵
                </div>
              </li>
              <li>你每回合可以移动两次。</li>
              <li>当你占领敌方将军时，他的所有领土和兵力都属于你，但兵力会减半。</li>
            </ul>
            <Typography variant='body1'>快捷键</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>快捷键</TableCell>
                  <TableCell>键位</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell>{row.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HowToPlay;
