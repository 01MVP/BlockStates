import { styled } from '@mui/material/styles';

const FooterContainer = styled('div')`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100vw;
  height: max-content;
  bottom: 0;
  left: 0;
  z-index: 80;
  backdrop-filter: blur(3px);
  background-color: #212936 !important;
`;

function Footer() {
  const chinaWebsite: boolean = process.env.NEXT_PUBLIC_SERVER_API.endsWith('cn');

  return (
    <FooterContainer>
      <div style={{ color: 'white' }}>
        版权所有 © 2022~{new Date().getFullYear()} Block Empire &nbsp;
        开源团队
      </div>
      {
        chinaWebsite && <a style={{ color: 'skyblue' }} href='https://beian.miit.gov.cn'>
          粤ICP备2022122081号-2
        </a>
      }
    </FooterContainer>
  );
}

export default Footer;
