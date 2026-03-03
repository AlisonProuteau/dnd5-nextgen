import { Fragment, type ReactNode } from 'react';
import { useSwipeable } from 'react-swipeable';
import type { SwipeableCallbacks } from 'react-swipeable/es/types';
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
import { useToggle } from '@hooks/useToggle';
import type { DefaultRepresentation } from '@representations/common.representation';

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
  children,
  'data-testid': dataTestId
}: {
  title: string;
  img: string;
  height?: number;
  onClick?: () => any;
  selected?: boolean;
  children?: ReactNode;
  'data-testid'?: string;
}) {
  const { isOn: isInfoOpen, turnOn: openInfo, turnOff: closeInfo } = useToggle();

  return (
    <Card
      key={`card-${title}`}
      elevation={0}
      data-testid={dataTestId}
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
        <Fragment>
          <DesignCardContent title={title} img={img} moreInfofn={openInfo} />
          {children && (
            <Dialog open={isInfoOpen} onClose={closeInfo}>
              <DialogTitle>{title}</DialogTitle>
              <DialogContent>{children}</DialogContent>
            </Dialog>
          )}
        </Fragment>
      )}
    </Card>
  );
}

interface CardCarouselProps {
  data: (DefaultRepresentation & { img?: string })[];
  activeStep: number;
  cardActions: Partial<SwipeableCallbacks>;
  children?: ReactNode;
  carouselType?: string;
}

export function CardCarousel({
  data,
  activeStep,
  cardActions,
  children,
  carouselType = 'generic'
}: CardCarouselProps) {
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
      data-testid={`${carouselType}-carousel`}
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
          data-testid={`${carouselType}-card-prev`}
        />
      )}

      <DesignCard
        title={data[activeStep].name}
        img={data[activeStep].img || ''}
        selected={true}
        data-testid={`${carouselType}-card-current`}
      >
        {children}
      </DesignCard>

      {!isMobile && (
        <DesignCard
          title={data[activeStep < data.length - 1 ? activeStep + 1 : 0].name}
          img={data[activeStep < data.length - 1 ? activeStep + 1 : 0].img || ''}
          height={300}
          onClick={cardActions.onSwipedRight as () => void}
          data-testid={`${carouselType}-card-next`}
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
