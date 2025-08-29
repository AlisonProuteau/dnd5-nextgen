import { ArrowBackIos, ArrowForwardIos, QuestionMark } from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  CardMedia,
  Dialog,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { DefaultRepresentation } from '@representations/common.representation';
import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import type { SwipeableCallbacks } from 'react-swipeable/es/types';

function DesignCardContent({
  title,
  img,
  moreInfofn
}: {
  title: string;
  img: string;
  moreInfofn?: () => void;
}) {
  const theme = useTheme();

  return (
    <Box height="100%" position="relative">
      {moreInfofn && (
        <Tooltip title="How to play?" placement="right">
          <IconButton
            size="small"
            sx={{ position: 'absolute', top: -5, right: -5 }}
            onClick={moreInfofn}
          >
            <QuestionMark />
          </IconButton>
        </Tooltip>
      )}
      <CardMedia
        sx={{
          height: '100%',
          objectFit: 'scale-down',
          overflow: 'hidden'
        }}
        component="img"
        image={img}
        alt={`Race visual ${title}`}
      />
      <Typography
        position="absolute"
        bottom={-5}
        width={'100%'}
        textAlign="center"
        color="white"
        sx={{ textShadow: `${theme.palette.primary.main} 0px 0px 1px` }}
      >
        {title}
      </Typography>
    </Box>
  );
}

function DesignCard({
  title,
  img,
  height = 400,
  onClick,
  selected = false,
  children
}: {
  title: string;
  img: string;
  height?: number;
  onClick?: () => any;
  selected?: boolean;
  children?: React.ReactNode;
}) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <Card
      key={`card-${title}`}
      elevation={0}
      style={{
        justifySelf: 'center',
        width: `${0.65 * height}px`,
        height: `${height}px`,
        border: selected ? '2px solid rgb(144, 202, 249)' : '1px solid transparent',
        boxShadow: selected
          ? '0 0 12px rgba(144, 202, 249, 0.4)'
          : '0 0 6px rgba(255, 255, 255, 0.3)',
        borderRadius: 16,
        padding: 5
      }}
    >
      {onClick ? (
        <CardActionArea sx={{ height: '100%' }} onClick={() => onClick?.()}>
          <DesignCardContent title={title} img={img} />
        </CardActionArea>
      ) : (
        <>
          <DesignCardContent title={title} img={img} moreInfofn={() => setInfoOpen(true)} />
          {children && (
            <Dialog open={infoOpen} onClose={() => setInfoOpen(false)}>
              <DialogTitle>{title}</DialogTitle>
              <DialogContent>{children}</DialogContent>
            </Dialog>
          )}
        </>
      )}
    </Card>
  );
}

export function CardCarousel({
  data,
  activeStep,
  cardActions,
  children
}: {
  data: (DefaultRepresentation & { img?: string })[];
  activeStep: number;
  cardActions: Partial<SwipeableCallbacks>;
  children?: React.ReactNode;
}) {
  const isMobile = useMediaQuery((theme: any) => theme.breakpoints.down('sm'));
  const swipeHandlers = useSwipeable(cardActions);

  return (
    <Box
      display="flex"
      gap="15px"
      width="100%"
      justifyContent="center"
      alignItems="center"
      {...swipeHandlers}
      marginBottom={2}
    >
      <IconButton onClick={cardActions.onSwipedLeft as () => void} size="large">
        <Icon>
          <ArrowBackIos />
        </Icon>
      </IconButton>
      {!isMobile && (
        <DesignCard
          title={data[activeStep > 0 ? activeStep - 1 : data.length - 1].name}
          img={data[activeStep > 0 ? activeStep - 1 : data.length - 1].img || ''}
          height={300}
          onClick={cardActions.onSwipedLeft as () => void}
        />
      )}

      <DesignCard title={data[activeStep].name} img={data[activeStep].img || ''} selected={true}>
        {children}
      </DesignCard>

      {!isMobile && (
        <DesignCard
          title={data[activeStep < data.length - 1 ? activeStep + 1 : 0].name}
          img={data[activeStep < data.length - 1 ? activeStep + 1 : 0].img || ''}
          height={300}
          onClick={cardActions.onSwipedRight as () => void}
        />
      )}
      <IconButton onClick={cardActions.onSwipedRight as () => void} size="large">
        <Icon>
          <ArrowForwardIos />
        </Icon>
      </IconButton>
    </Box>
  );
}
